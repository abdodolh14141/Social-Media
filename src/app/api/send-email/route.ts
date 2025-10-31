import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Request body:", body);

    // Validate required fields
    if (!body.to || !body.subject) {
      return NextResponse.json(
        { error: "Missing required fields: 'to' and 'subject' are required" },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: "Email configuration is missing" },
        { status: 500 }
      );
    }

    // For Gmail, use these specific settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Helps with some certificate issues
      },
    });

    // Test the connection
    console.log("Testing transporter connection...");
    await transporter.verify();
    console.log("Transporter verified successfully");

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: body.to,
      subject: body.subject,
    };

    console.log("Sending email to:", body.to);
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);

    return NextResponse.json({
      message: "Password reset email sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Detailed error sending email:");

    let errorMessage = "Failed to send email. Please try again.";

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      if (
        error.message.includes("535-5.7.8") ||
        error.message.includes("BadCredentials") ||
        error.message.includes("Invalid login")
      ) {
        errorMessage =
          "Email service configuration error. Please contact support.";
        console.error("SMTP Authentication failed. Check if:");
        console.error(
          "1. You're using an App Password (not your regular Gmail password)"
        );
        console.error("2. 2-Factor Authentication is enabled");
        console.error("3. The App Password is correct");
      } else if (error.message.includes("ECONNREFUSED")) {
        errorMessage =
          "Cannot connect to email server. Please try again later.";
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = "Email server not found. Please check configuration.";
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
