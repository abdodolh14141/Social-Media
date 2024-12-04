import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Followers from "@/app/models/followers";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await Connect();

    // Extract and validate the required fields from the request body
    const { FollowById, AccountId } = await req.json();
    if (
      !mongoose.Types.ObjectId.isValid(FollowById) ||
      !mongoose.Types.ObjectId.isValid(AccountId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: FollowById or AccountId",
        },
        { status: 400 }
      );
    }

    // Check if the target user's followers data exists
    const existingFollow = await Followers.findOne({ idUser: AccountId });

    if (!existingFollow) {
      return NextResponse.json(
        { success: false, message: "User's follow data not found" },
        { status: 404 }
      );
    }

    // Determine follow/unfollow action based on current state
    const isFollowing = existingFollow.FollowBy.includes(FollowById);

    if (isFollowing) {
      // If already following, remove FollowById to unfollow
      existingFollow.FollowBy = existingFollow.FollowBy.filter(
        (id: string) => id !== FollowById
      );
      existingFollow.Follow -= 1;

      await existingFollow.save();

      return NextResponse.json(
        {
          success: true,
          message: "Successfully unfollowed the user",
          action: "unfollow",
        },
        { status: 200 }
      );
    } else {
      // If not following, add FollowById to follow
      existingFollow.FollowBy.push(FollowById);
      existingFollow.Follow += 1;

      await existingFollow.save();

      return NextResponse.json(
        {
          success: true,
          message: "Successfully followed the user",
          action: "follow",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
