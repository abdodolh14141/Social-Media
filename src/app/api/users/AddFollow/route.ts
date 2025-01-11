"use server";

import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/app/models/userModel";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await Connect();

    // Parse request body
    const {
      FollowByEmail,
      AccountId,
    }: { FollowByEmail: string; AccountId: string } = await req.json();

    // Validate input data
    if (!FollowByEmail || !AccountId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: FollowByEmail or AccountId.",
        },
        { status: 400 }
      );
    }

    // Check if the target user exists
    const targetUser = await User.findById(AccountId);
    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Target user not found.",
        },
        { status: 404 }
      );
    }

    // Ensure Followers is an array
    const followers = targetUser.Followers || [];

    // Check if the user is already following
    const isFollowing = followers.includes(FollowByEmail);

    // Update follow/unfollow status
    let action: "follow" | "unfollow";
    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(
        AccountId,
        {
          $pull: { Followers: FollowByEmail },
          $inc: { Follow: -1 },
        },
        { new: true }
      );
      action = "unfollow";
    } else {
      // Follow
      await User.findByIdAndUpdate(
        AccountId,
        {
          $addToSet: { Followers: FollowByEmail },
          $inc: { Follow: 1 },
        },
        { new: true }
      );
      action = "follow";
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully ${action}ed the user.`,
        action,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Server error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
