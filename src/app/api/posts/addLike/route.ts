"use server";

import { NextResponse, NextRequest } from "next/server";
import { Connect } from "@/dbConfig/dbConfig";
import Posts from "@/app/models/posts";
import mongoose from "mongoose";

// Define request body types
interface RequestBody {
  postId: string;
  userEmail: string;
}

// Response messages
const MESSAGES = {
  INVALID_POST_ID: "Invalid postId format",
  MISSING_EMAIL: "User email is required",
  POST_NOT_FOUND: "Post not found",
  LIKE_ADDED: "Post liked successfully",
  LIKE_REMOVED: "Like removed",
  SERVER_ERROR: "Server error. Please try again.",
};

// Utility function to validate ObjectId
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await Connect();

    // Parse and validate request body
    const { postId, userEmail }: RequestBody = await req.json();

    if (!isValidObjectId(postId)) {
      return NextResponse.json(
        { success: false, message: MESSAGES.INVALID_POST_ID },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: MESSAGES.MISSING_EMAIL },
        { status: 400 }
      );
    }

    // Find the post by ID
    const post = await Posts.findById(postId);
    if (!post) {
      return NextResponse.json(
        { success: false, message: MESSAGES.POST_NOT_FOUND },
        { status: 404 }
      );
    }

    // Handle likes
    const userAlreadyLiked = post.likedBy.includes(userEmail);

    if (userAlreadyLiked) {
      // Remove like
      post.likedBy = post.likedBy.filter(
        (email: string) => email !== userEmail
      );
      post.Like = Math.max((post.Like || 0) - 1, 0);
      await post.save();

      return NextResponse.json(
        { success: true, message: MESSAGES.LIKE_REMOVED, liked: false },
        { status: 200 }
      );
    } else {
      // Add like
      post.likedBy.push(userEmail);
      post.Like = (post.Like || 0) + 1;
      await post.save();

      return NextResponse.json(
        { success: true, message: MESSAGES.LIKE_ADDED, liked: true },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error(
      "Server error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { success: false, message: MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
