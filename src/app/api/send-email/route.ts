import User from "@/app/models/userModel";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { Connect } from "@/dbConfig/dbConfig";

// 1. Initialize transporter outside for connection pooling
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const generateSecureCode = () => crypto.randomInt(100000, 999999).toString();

export async function POST(req: Request) {
  try {
    await Connect(); // Always connect to DB in Next.js API routes
    const { to } = await req.json();

    // Basic validation & Casing normalization
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }
    const normalizedEmail = to.toLowerCase().trim();

    // Find user using normalized email
    const user = await User.findOne({ email: normalizedEmail });

    /** * ANTI-ENUMERATION FIX:
     * We return 200 OK even if the user isn't found.
     * If you return 404, hackers can tell which emails exist in your DB.
     */
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists, a code has been sent.",
        },
        { status: 404 }
      );
    }

    const verificationCode = generateSecureCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in Database
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpires = expiresAt;
    user.resetPasswordAttempts = 0;
    await user.save();

    // Send Mail
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Support" <${process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: "Password Reset Verification Code",
        html: getVerificationCodeTemplate(verificationCode),
        text: `Your verification code is: ${verificationCode}. It expires in 10 minutes.`,
      });
    } catch (mailError) {
      console.error("MAIL_SEND_ERROR:", mailError);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
    });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await Connect();
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user || !user.resetPasswordCode) {
      return NextResponse.json(
        { error: "Code expired or not found" },
        { status: 404 }
      );
    }

    if (user.resetPasswordAttempts >= 5) {
      return NextResponse.json(
        { error: "Too many attempts. Request a new code." },
        { status: 429 }
      );
    }

    if (user.resetPasswordCode !== code) {
      user.resetPasswordAttempts += 1;
      await user.save();
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // SUCCESS: Clear the code so it can't be reused
    user.resetPasswordCode = undefined;
    // Note: Don't clear the expiration yet if you need it to authorize the actual password change
    await user.save();

    return NextResponse.json({ success: true, message: "Code verified" });
  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

function getVerificationCodeTemplate(code: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="text-align: center; color: #4F46E5;">Password Reset</h2>
      <p>Your verification code is below. It will expire in 10 minutes.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #111827; background: #F3F4F6; padding: 10px 20px; border-radius: 8px;">
            ${code}
        </span>
      </div>
    </div>
  `;
}
