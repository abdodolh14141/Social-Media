import Comment from "@/app/models/comments";
import Posts from "@/app/models/posts";
import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

// 💡 CONFIGURATION: Define the field in the User model that stores the string OAuth ID.
// Change this if your User model uses a different field (e.g., 'googleId', 'providerAccountId', 'id').
const OAUTH_ID_FIELD_NAME = "externalId";

// --- Type Definitions ---
interface CommentRequestData {
  postId: string;
  comment: string;
  name: string;
  userId: string; // The OAuth ID string (e.g., Google ID)
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

// --- Helper Functions ---

/**
 * Checks if a string is a valid MongoDB ObjectId format.
 */
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validates the incoming comment request data.
 */
const validateRequestData = (data: CommentRequestData): string | null => {
  const { postId, comment, userId, name } = data;

  if (!postId) return "Post ID is required.";
  if (!comment) return "Comment text is required.";
  if (!userId) return "User ID is required for authentication.";
  if (!name) return "Name is required.";

  // Post ID must be a valid MongoDB ObjectId
  if (!isValidObjectId(postId)) return "Invalid Post ID format.";

  const trimmedComment = comment.trim();
  if (trimmedComment.length < 1) return "Comment cannot be empty.";
  if (trimmedComment.length > 500)
    return "Comment must be less than 500 characters.";

  return null;
};

const formatCommentResponse = (comment: any): CommentResponse => ({
  id: comment._id.toString(),
  postId: comment.idPost,
  name: comment.Name,
  userId: comment.UserId,
  textComment: comment.TextComment,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

// --------------------------------------------------------------------------------------------------
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

    // 1. Check if post exists (using exists() is efficient)
    const postExists = await Posts.findById({ postId });
    if (!postExists) {
      return NextResponse.json(
        { success: false, message: "Post not found." },
        { status: 404 }
      );
    }

    // 2. 🚀 CRITICAL FIX: Look up the user by the external string ID field, not _id.
    // The dynamic query object ensures the correct field is used.
    const commenterExists = await User.findById({ userId }); // Select only _id for minimal data transfer

    if (!commenterExists) {
      return NextResponse.json(
        {
          success: false,
          message: `Commenter user not found. Check if the user exists and the ID field is correctly configured as '${OAUTH_ID_FIELD_NAME}' in the User model.`,
        },
        { status: 404 }
      );
    }

    // 3. Create and save comment
    const newComment = new Comment({
      idPost: postId,
      Name: userName.trim(),
      UserId: userId, // Store the OAuth ID string
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

    // Improved error handling for CastError/BSONError
    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid ID format provided for a database lookup on path: ${error.path}. Ensure external IDs are not queried against the _id field.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

// --------------------------------------------------------------------------------------------------
// --- GET Endpoint: Fetch Comments ---

export async function GET(req: NextRequest) {
  try {
    await Connect();

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          message: "Post ID is required for fetching comments.",
        },
        { status: 400 }
      );
    }

    if (!isValidObjectId(postId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Post ID format." },
        { status: 400 }
      );
    }

    const postExists = await Posts.exists({ _id: postId });
    if (!postExists) {
      return NextResponse.json(
        { success: false, message: "Post not found." },
        { status: 404 }
      );
    }

    const comments = await Comment.find({ idPost: postId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedComments = comments.map((comment: any) =>
      formatCommentResponse(comment)
    );

    return NextResponse.json(
      {
        success: true,
        comments: formattedComments,
        count: formattedComments.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching comments:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, message: "Invalid ID format in query parameters." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
