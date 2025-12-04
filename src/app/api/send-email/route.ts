import User from "@/app/models/userModel";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Email template for verification code
const getVerificationCodeTemplate = (
  verificationCode: string,
  expiresIn: string = "10 minutes"
) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f6f9fc;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
            color: white;
        }
        .content { 
            background: #ffffff; 
            padding: 40px 30px; 
            border: 1px solid #e0e6ef; 
            border-top: none;
            border-radius: 0 0 10px 10px;
        }
        .verification-code { 
            display: inline-block; 
            padding: 15px 30px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #6c757d; 
            font-size: 14px; 
            padding-top: 20px;
            border-top: 1px solid #e0e6ef;
        }
        .security-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .code-container {
            text-align: center;
            margin: 30px 0;
        }
        .instructions {
            background: #e8f4fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Verification Code</h1>
            <p>Password Reset Request</p>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. Use the verification code below to complete the process:</p>
            
            <div class="code-container">
                <div class="verification-code">${verificationCode}</div>
            </div>

            <div class="instructions">
                <p><strong>How to use this code:</strong></p>
                <ol>
                    <li>Return to the password reset page</li>
                    <li>Enter the 6-digit code shown above</li>
                    <li>Create your new password</li>
                </ol>
            </div>

            <div class="security-note">
                <p><strong>⚠️ Security Notice:</strong></p>
                <ul>
                    <li>This code will expire in <strong>${expiresIn}</strong></li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Never share this code with anyone</li>
                </ul>
            </div>
            
            <p>Best regards,<br><strong>Your App Team</strong></p>
        </div>
        <div class="footer">
            <p>If you didn't request this code, please secure your account and contact support.</p>
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// In-memory store for verification codes (use Redis in production)
const verificationCodes = new Map();
const RATE_LIMIT = new Map();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;
const CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();

  // Rate limiting check
  const clientData = RATE_LIMIT.get(clientIP);
  if (clientData) {
    const { count, firstRequest } = clientData;
    if (now - firstRequest < RATE_LIMIT_WINDOW) {
      if (count >= RATE_LIMIT_MAX_REQUESTS) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Too many verification code requests. Please try again in 15 minutes.",
          },
          { status: 429 }
        );
      }
      RATE_LIMIT.set(clientIP, { count: count + 1, firstRequest });
    } else {
      RATE_LIMIT.set(clientIP, { count: 1, firstRequest: now });
    }
  } else {
    RATE_LIMIT.set(clientIP, { count: 1, firstRequest: now });
  }

  // Clean up old entries periodically
  if (Math.random() < 0.1) {
    for (const [ip, data] of RATE_LIMIT.entries()) {
      if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
        RATE_LIMIT.delete(ip);
      }
    }
    for (const [email, data] of verificationCodes.entries()) {
      if (now > data.expiresAt) {
        verificationCodes.delete(email);
      }
    }
  }

  try {
    const body = await req.json();
    console.log("📧 Verification code request for:", body.to);

    // Validate required fields
    if (!body.to) {
      return NextResponse.json(
        {
          success: false,
          error: "Email address is required",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address format",
        },
        { status: 400 }
      );
    }

    // check email in database (pseudo code, implement according to your database)
    const checkUser = await User.findOne({ email: body.to });
    if (!checkUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = now + CODE_EXPIRY;

    // Store code with expiration
    verificationCodes.set(body.to, {
      code: verificationCode,
      expiresAt: expiresAt,
      attempts: 0,
    });

    console.log(
      `🔐 Generated code for ${
        body.to
      }: ${verificationCode} (expires: ${new Date(expiresAt).toISOString()})`
    );

    // SMTP configuration
    const smtpConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "465", 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    };

    console.log("🔧 Creating transporter with config:", {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user?.substring(0, 3) + "...",
    });

    const transporter = nodemailer.createTransport(smtpConfig);

    // Test the connection
    console.log("🔧 Testing transporter connection...");
    await transporter.verify();
    console.log("✅ Transporter verified successfully");

    // Prepare email content
    const fromAddress =
      process.env.SMTP_FROM || `"Your App" <${process.env.SMTP_USER}>`;

    const mailOptions = {
      from: fromAddress,
      to: body.to,
      subject: body.subject || "Your Password Reset Verification Code",
      html: getVerificationCodeTemplate(verificationCode, "10 minutes"),
      text: `
Password Reset Verification Code

Your verification code is: ${verificationCode}

This code will expire in 10 minutes.

Enter this code on the password reset page to create a new password.

If you didn't request a password reset, please ignore this email.

Best regards,
Your App Team
            `.trim(),
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
    };

    console.log("📤 Sending verification code to:", body.to);
    const result = await transporter.sendMail(mailOptions);
    console.log(
      "✅ Verification code sent successfully. Message ID:",
      result.messageId
    );

    // Close the transporter
    transporter.close();

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      messageId: result.messageId,
      // Don't send the code back to the client for security
      hint: "Check your email for the 6-digit verification code",
    });
  } catch (error) {
    console.error("❌ Error sending verification code:");

    let errorMessage = "Failed to send verification code. Please try again.";
    let statusCode = 500;

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      if (
        error.message.includes("535-5.7.8") ||
        error.message.includes("BadCredentials") ||
        error.message.includes("Invalid login") ||
        error.message.includes("Authentication failed")
      ) {
        errorMessage =
          "Email service authentication failed. Please contact support.";
        statusCode = 500;
        console.error(
          "🔐 SMTP Authentication failed - check App Password configuration"
        );
      } else if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEDOUT")
      ) {
        errorMessage =
          "Cannot connect to email server. Please try again later.";
        statusCode = 503;
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = "Email server not found. Please check configuration.";
        statusCode = 500;
      } else if (error.message.includes("EAUTH")) {
        errorMessage = "Email authentication failed. Please contact support.";
        statusCode = 500;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}

// Verify code endpoint
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and verification code are required",
        },
        { status: 400 }
      );
    }

    const storedData = verificationCodes.get(email);
    const now = Date.now();

    if (!storedData) {
      return NextResponse.json(
        {
          success: false,
          error: "No verification code found for this email",
        },
        { status: 404 }
      );
    }

    if (now > storedData.expiresAt) {
      verificationCodes.delete(email);
      return NextResponse.json(
        {
          success: false,
          error: "Verification code has expired",
        },
        { status: 410 }
      );
    }

    // Increment attempts
    storedData.attempts += 1;

    if (storedData.attempts > 5) {
      verificationCodes.delete(email);
      return NextResponse.json(
        {
          success: false,
          error: "Too many failed attempts. Please request a new code.",
        },
        { status: 429 }
      );
    }

    if (storedData.code !== code) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification code",
          attempts: storedData.attempts,
        },
        { status: 400 }
      );
    }

    // Code is valid - mark it as used but don't delete yet (for the reset process)
    storedData.verified = true;

    return NextResponse.json({
      success: true,
      message: "Verification code is valid",
    });
  } catch (error) {
    console.error("❌ Error verifying code:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify code",
      },
      { status: 500 }
    );
  }
}

// Optional: GET handler for testing email configuration
export async function GET() {
  return NextResponse.json({
    message: "Verification Code API is running",
    requiredEnvVars: ["SMTP_USER", "SMTP_PASS"],
    optionalEnvVars: ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM"],
    features: [
      "POST /api/send-email - Send verification code",
      "PUT /api/send-email - Verify code",
      "Rate limiting enabled",
      "Code expiration (10 minutes)",
    ],
  });
}
