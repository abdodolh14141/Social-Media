"use server";

import { NextRequest, NextResponse } from "next/server";
import { Connect } from "@/dbConfig/dbConfig";
import Report from "@/app/models/report";

// Helper function to validate input
const validateInput = (email: string, message: string): string | null => {
  if (!email || !email.includes("@")) {
    return "Invalid email address";
  }
  if (!message || message.trim().length < 10) {
    return "Message must be at least 10 characters long";
  }
  return null;
};

// Main POST handler
export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await Connect();

    // Parse and validate the request body
    const body = await req.json();
    const { email, message } = body;

    const validationError = validateInput(email, message);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    // Create and save the report
    const report = new Report({
      ReportMsg: message.trim(),
      Email: email.trim(),
    });

    await report.save();

    // Return success response
    return NextResponse.json(
      { success: true, message: "Successfully saved the report" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving report:", error);

    // Return server error response
    return NextResponse.json(
      { success: false, message: "Failed to save report due to server error" },
      { status: 500 }
    );
  }
}
