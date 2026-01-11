import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { Connect } from "@/dbConfig/dbConfig";
import User from "@/app/models/userModel";
import resetSchema from "@/app/models/resetSchema";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<any> }
) {
  try {
    const { email, token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Valid email is required" },
        { status: 400 }
      );
    }

    await Connect();

    const user = await User.findOne({ Email: email });
    if (!user)
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await resetSchema.findOne({
      userId: user._id,
      tokenHash,
      used: false,
    });
    if (!record)
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    if (record.expiresAt < new Date())
      return NextResponse.json({ error: "Token expired" }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 12);
    user.passwordHash = passwordHash;
    await user.save();

    record.used = true;
    await record.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
