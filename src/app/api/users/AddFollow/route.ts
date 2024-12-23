"use server";

import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/app/models/userModel";

// Utility function to handle follow/unfollow logic
async function handleFollowAction(FollowByEmail: string, AccountId: string) {
  // Check if the target user exists and update follow status
  const update = {
    $addToSet: { FollowBy: FollowByEmail },
    $inc: { Follow: 1 },
  };
  const options = { new: true };

  const targetUser = await User.findByIdAndUpdate(AccountId, update, options);

  if (!targetUser) {
    return {
      success: false,
      message: "Target user not found.",
      status: 404,
    };
  }

  // Ensure FollowBy is an array
  const followByList = targetUser.FollowBy || [];

  const isFollowing = followByList.includes(FollowByEmail);

  if (isFollowing) {
    // Unfollow logic
    await User.findByIdAndUpdate(
      AccountId,
      {
        $pull: { FollowBy: FollowByEmail },
        $inc: { Follow: -1 },
      },
      options
    );

    return {
      success: true,
      message: "Successfully unfollowed the user.",
      action: "unfollow",
      status: 200,
    };
  } else {
    // Follow logic
    return {
      success: true,
      message: "Successfully followed the user.",
      action: "follow",
      status: 200,
    };
  }
}

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

    // Handle follow/unfollow action
    const result = await handleFollowAction(FollowByEmail, AccountId);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        action: result.action,
      },
      { status: result.status }
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
