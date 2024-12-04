"use server";
import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

// Define the interface for UserData
interface UserData {
  username: string;
  email: string;
  age: number;
  gender: string;
  password: string;
}

export async function POST(req: NextRequest) {
  await Connect();

  try {
    const bodyJson: UserData = await req.json();

    // Extract form data from req.body
    const { username, email, age, gender, password } = bodyJson;

    // Basic validation
    if (!username || !email || !age || !gender || !password) {
      return NextResponse.json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ Email: email });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // Hash password
    const hashPass = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      Name: username,
      Email: email,
      Age: age,
      Gender: gender,
      Password: hashPass,
    });

    // Save new user to database
    await newUser.save();

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      data: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Server error: ${(error as Error).message}`,
    });
  }
}
