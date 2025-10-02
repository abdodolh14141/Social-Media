import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Request body:", body);

    // Validate required fields
    if (!body.to || !body.subject) {
      console.log("Missing fields - to:", body.to, "subject:", body.subject);
      return NextResponse.json(
        { error: "Missing required fields: 'to' and 'subject' are required" },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log(
        "Missing env vars - EMAIL_USER:",
        !!process.env.GMAIL_USER,
        "EMAIL_PASS:",
        !!process.env.GMAIL_PASS
      );
      return NextResponse.json(
        { error: "Email configuration is missing" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Test the connection
    console.log("Testing transporter connection...");
    await transporter.verify();
    console.log("Transporter verified successfully");

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: body.to,
      subject: body.subject,
    };

    console.log("Sending email to:", body.to);
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Detailed error sending email:");
    console.error(
      "Error name:",
      error instanceof Error ? error.name : "Unknown"
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : error
    );
    console.error("Full error:", error);

    return NextResponse.json(
      { error: "Failed to send email. Check server logs for details." },
      { status: 500 }
    );
  }
}
