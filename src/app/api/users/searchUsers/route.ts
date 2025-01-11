import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await Connect();

    const bodyJson = await req.json();

    // Validate if name is provided and is a non-empty string
    if (
      !bodyJson?.name ||
      typeof bodyJson.name !== "string" ||
      bodyJson.name.trim() === ""
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing 'name' parameter" },
        { status: 400 }
      );
    }

    // Search for the user by name
    const users = await User.find({
      Name: { $regex: new RegExp(bodyJson.name.trim(), "i") },
    });

    // Check if users were found
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: "No users found with the provided name" },
        { status: 404 }
      );
    }

    // Return the user(s) found
    return NextResponse.json(
      { success: true, message: "User(s) found successfully", user: users },
      { status: 200 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Server error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
      },
      { status: 500 }
    );
  }
}
