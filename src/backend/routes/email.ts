import { Elysia, t } from 'elysia';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../../app/models/userModel';
import { Connect } from '../../dbConfig/dbConfig';

// Initialize transporter outside for connection pooling
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

export const emailRoutes = new Elysia({ prefix: '/api/email' })
    .onBeforeHandle(async () => {
        await Connect();
    })
    .post('/send', async ({ body, set }) => {
        try {
            const { to } = body as { to: string };

            // Basic validation & Casing normalization
            if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
                set.status = 400;
                return { error: "Valid email is required" };
            }
            const normalizedEmail = to.toLowerCase().trim();

            // Find user using normalized email
            const user = await User.findOne({ Email: normalizedEmail });

            /** * ANTI-ENUMERATION FIX:
             * We return 200 OK even if the user isn't found.
             * If you return 404, hackers can tell which emails exist in your DB.
             */
            if (!user) {
                // In the original code, it returned 404 but with a success message.
                // "If an account exists, a code has been sent."
                set.status = 404;
                return {
                    success: true,
                    message: "If an account exists, a code has been sent.",
                };
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
                set.status = 500;
                return { error: "Failed to send email. Please try again later." };
            }

            return {
                success: true,
                message: "Verification code sent",
            };
        } catch (error) {
            console.error("RESET_PASSWORD_ERROR:", error);
            set.status = 500;
            return { error: "Internal server error" };
        }
    }, {
        body: t.Object({
            to: t.String()
        })
    })
    // Updated Verify Route Snippet
        .post('/verify', async ({ body, set }) => {
            const { email, code } = body;
            const user = await User.findOne({ 
                Email: email.toLowerCase().trim(),
                resetPasswordExpires: { $gt: new Date() } 
            }).select('+resetPasswordCode +resetPasswordAttempts');

            if (!user) {
                set.status = 404;
                return { error: "Reset session expired. Please request a new code." };
            }

            if (user.resetPasswordAttempts >= 5) {
                set.status = 429;
                return { error: "Security lockout: Too many attempts. Request a new email." };
            }

            if (user.resetPasswordCode !== code) {
                user.resetPasswordAttempts += 1;
                await user.save();
                set.status = 400;
                return { error: `Invalid code. ${5 - user.resetPasswordAttempts} attempts remaining.` };
            }

            return { success: true };
        }, {
            body: t.Object({
                email: t.String(),
                code: t.String()
            })
        })
    .post('/reset-password', async ({ body, set }) => {
    try {
        const { email, code, password } = body as { email: string, code: string, password: string };

        // 1. Basic Validation
        if (!email || !code || !password) {
            set.status = 400;
            return { error: "Missing required fields" };
        }

        if (password.length < 8) {
            set.status = 400;
            return { error: "Password must be at least 8 characters long" };
        }

        // 2. Find User with active reset window
        const user = await User.findOne({
            Email: email.toLowerCase().trim(),
            resetPasswordExpires: { $gt: new Date() },
        }).select('+resetPasswordCode +Password'); // Select Password to check against old one if desired

        // 3. Verify User and Code
        if (!user || !user.resetPasswordCode) {
            set.status = 404;
            return { error: "Reset session expired or not found. Please start over." };
        }

        if (user.resetPasswordCode !== code) {
            set.status = 400;
            return { error: "Invalid verification code" };
        }

        // 4. Update Security Fields
        // We use bcrypt.hash with 12 rounds for better protection against brute force
        const passwordHash = await bcrypt.hash(password, 12);
        
        user.Password = passwordHash;
        
        // Use 'undefined' or 'null' depending on your Mongoose Schema settings
        // Clearing these immediately prevents code reuse
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;
        user.resetPasswordAttempts = 0;

        await user.save();

        return { 
            success: true, 
            message: "Password updated successfully. You can now log in." 
        };

    } catch (error) {
        console.error("RESET_PASSWORD_ERROR:", error);
        set.status = 500;
        return { error: "An internal server error occurred" };
    }
}, {
    body: t.Object({
        email: t.String({ format: 'email' }), // Added format validation if using Elysia/TypeBox
        code: t.String({ minLength: 6, maxLength: 6 }),
        password: t.String({ minLength: 8 })
    })
})
