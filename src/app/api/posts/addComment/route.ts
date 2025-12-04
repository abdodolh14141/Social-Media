import Comment from "@/app/models/comments";
import Posts from "@/app/models/posts";
import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

// ====================================================================================
// --- CONFIGURATION ---

/**
 * CONFIGURATION: Define the field in the User model that stores the string OAuth ID.
 * CHANGE THIS VALUE to match your User Schema (e.g., "googleId", "clerkId", "auth0Id", "email").
 */
const USER_OAUTH_FIELD = "googleId";

// ====================================================================================
// --- Type Definitions ---

interface CommentRequestData {
  postId: string;
  comment: string;
  name: string;
  userId: string; // The OAuth ID string
}

interface CommentResponse {
  id: string;
  postId: string;
  name: string;
  userId: string;
  textComment: string;
  createdAt: Date;
  updatedAt: Date;
}

// ====================================================================================
// --- Helper Functions ---

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

const validateRequestData = (data: CommentRequestData): string | null => {
  const { postId, comment, userId, name } = data;

  if (!postId) return "Post ID is required.";
  if (!comment) return "Comment text is required.";
  if (!userId) return "User ID is required.";
  if (!name) return "Name is required.";

  if (!isValidObjectId(postId))
    return "Invalid Post ID format. Must be a valid MongoDB ObjectId.";

  const trimmedComment = comment.trim();
  if (trimmedComment.length < 1) return "Comment cannot be empty.";
  if (trimmedComment.length > 500)
    return "Comment must be less than 500 characters.";

  return null;
};

const formatCommentResponse = (comment: any): CommentResponse => ({
  id: comment._id,
  postId: comment.idPost,
  name: comment.Name,
  userId: comment.UserId,
  textComment: comment.TextComment,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

// ====================================================================================
// --- POST Endpoint: Create Comment ---

export async function POST(req: NextRequest) {
  try {
    await Connect();

    let requestData: CommentRequestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const validationError = validateRequestData(requestData);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const {
      postId,
      name: userName,
      comment: userComment,
      userId,
    } = requestData;

    // 1. Check if post exists
    // CRITICAL FIX: Use findById to allow commenting on ANY post, not just the user's own.
    const postExists = await Posts.findById(postId).exec();

    if (!postExists) {
      return NextResponse.json(
        { success: false, message: "Post not found." },
        { status: 404 }
      );
    }

    // 2. (Optional but Recommended) Verify the User exists in your DB to prevent ghost comments
    // Using the configuration field for OAuth lookup
    const userQuery = { [USER_OAUTH_FIELD]: userId };
    const UserExists = await User.findOne(userQuery).exec();

    if (!UserExists) {
      // You can choose to fail here, or just proceed if you trust the frontend token.
      // It is safer to fail if the user is not in your DB.
      console.warn(
        `Warning: Commenting user ${userId} not found in User collection.`
      );
    }

    // 3. Check for duplicates (Rate limiting/Spam prevention)
    const commentIsExists = await Comment.findOne({
      UserId: userId,
      idPost: postId,
      TextComment: userComment.trim(), // Strict check: same user, same post, SAME text
    }).exec();

    // Note: Checking ONLY userId and idPost prevents a user from commenting twice on the same post ever.
    // If you want to allow multiple comments, check the TextComment content too (as added above)
    // or remove this check entirely.

    if (commentIsExists) {
      return NextResponse.json(
        { success: false, message: "You have already posted this comment." },
        { status: 409 }
      );
    }

    // 4. Create and save comment
    const newComment = new Comment({
      idPost: postId,
      Name: userName.trim(),
      UserId: userId,
      TextComment: userComment.trim(),
    });

    const savedComment = await newComment.save();

    return NextResponse.json(
      {
        success: true,
        message: "Comment added successfully.",
        comment: formatCommentResponse(savedComment),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error adding comment:", error);
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, message: "Invalid ID format." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
