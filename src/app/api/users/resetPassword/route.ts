import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { Connect } from "@/dbConfig/dbConfig";
import User from "@/app/models/userModel";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

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

    await Connect();

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    user.Password = hashed;
    user.resetPasswordToken = undefined as any;
    user.resetPasswordExpires = undefined as any;

    await user.save();

    return NextResponse.json({ message: "Password has been reset" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
