// lib/mail.js (same as before)
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendResetEmail({ to, resetUrl }) {
  const html = `
    <p>Click to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
  `;
  await transporter.sendMail({
    from: `"My App" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Password Reset",
    html,
  });
}
