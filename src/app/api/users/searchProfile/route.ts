"use server";

import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await Connect();

    // Parse request body
    const reqBody = await req.json();
    const { id: IdUser } = reqBody;

    // Validate ID
    if (!IdUser) {
      return NextResponse.json(
        { success: false, message: "User ID not provided" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existUser = await User.findOne({ _id: IdUser });
    if (!existUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "User found successfully", user: existUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Server error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
