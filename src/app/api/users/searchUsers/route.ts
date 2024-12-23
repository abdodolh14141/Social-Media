import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await Connect();

    const bodyJson = await req.json();

    // Validate if name is provided
    if (!bodyJson?.name || typeof bodyJson.name !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid name provided" },
        { status: 400 }
      );
    }

    // Search for the user
    const existUser = await User.find({ Name: bodyJson.name });

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
