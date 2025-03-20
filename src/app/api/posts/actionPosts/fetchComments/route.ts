import { NextResponse, NextRequest } from "next/server";
import { Connect } from "@/dbConfig/dbConfig";
import Comment from "@/app/models/comments";
import Posts from "@/app/models/posts";
import User from "@/app/models/userModel";
import mongoose from "mongoose";

/* ------------------------------------------------------------------ */
/* Types & Interfaces                                                 */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const USER_OAUTH_FIELD = "googleId";

const formatCommentResponse = (comment: any): CommentResponse => ({
  id: comment._id,
  postId: comment.idPost,
  name: comment.Name,
  userId: comment.UserId,
  textComment: comment.TextComment,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper for consistent JSON responses
const jsonResponse = (success: boolean, message: any, status: number) => {
  const payload = success ? message : { message };
  return NextResponse.json({ success, ...payload }, { status });
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

/* ------------------------------------------------------------------ */
/* GET: Fetch All Comments                                            */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    await Connect();

    // Optimization: Exclude __v and other internal fields if not needed
    const comments = await Comment.find({})
      .select("-__v")
      .sort({ createdAt: -1 }) // Usually you want newest comments first
      .lean()
      .exec();

    return jsonResponse(true, { comments }, 200);
  } catch (err: any) {
    return jsonResponse(false, err?.message ?? "Failed to fetch comments", 500);
  }
}

/* ------------------------------------------------------------------ */
/* POST: Create a Comment                                             */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    await Connect();

    // Safe JSON parsing
    let requestData: CommentRequestData;
    try {
      requestData = await req.json();
    } catch {
      return jsonResponse(false, "Invalid JSON in request body.", 400);
    }

    // Validation
    const validationError = validateRequestData(requestData);
    if (validationError) {
      return jsonResponse(false, validationError, 400);
    }

    const { postId, name, comment, userId } = requestData;

    // 1. Relational Check: Ensure the Post exists
    //
    const postExists = await Posts.findById(postId).select("_id").exec();
    if (!postExists) {
      return jsonResponse(false, "Post not found.", 404);
    }

    // 2. User Integrity Check (Optional but safer)
    const userQuery = { [USER_OAUTH_FIELD]: userId };
    const userExists = await User.findOne(userQuery).select("_id").exec();

    if (!userExists) {
      console.warn(`[Audit] Comment attempt by unknown user ID: ${userId}`);
      // return jsonResponse(false, "User not authorized", 403); // Uncomment to enforce strict user checks
    }

    // 3. Spam Prevention: Check for identical duplicate comments
    const duplicateComment = await Comment.findOne({
      UserId: userId,
      idPost: postId,
      TextComment: comment.trim(),
    }).exec();

    if (duplicateComment) {
      return jsonResponse(false, "You have already posted this comment.", 409);
    }

    // 4. Save to Database
    const newComment = await new Comment({
      idPost: postId,
      Name: name.trim(),
      UserId: userId,
      TextComment: comment.trim(),
    }).save();

    return jsonResponse(
      true,
      {
        message: "Comment added successfully.",
        comment: formatCommentResponse(newComment),
      },
      201
    );
  } catch (error: any) {
    console.error("Error adding comment:", error);
    return jsonResponse(false, "Internal server error.", 500);
  }
}

/* ------------------------------------------------------------------ */
/* DELETE: Remove a Comment                                           */
/* ------------------------------------------------------------------ */
// CRITICAL FIX: Changed from 'export default' to named export 'DELETE'
export async function DELETE(req: NextRequest) {
  try {
    await Connect();

    // Safe JSON parsing
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(false, "Invalid JSON body", 400);
    }

    // Support both direct { commentId: "..." } and nested { data: { commentId: "..." } }
    // to match your frontend logic
    const commentId = body.data?.commentId || body.commentId;

    if (!commentId || !isValidObjectId(commentId)) {
      return jsonResponse(false, "Invalid or missing comment ID.", 400);
    }

    //
    const deletedComment = await Comment.findByIdAndDelete({
      _id: commentId,
    }).exec();

    if (!deletedComment) {
      return jsonResponse(false, "Comment not found or already deleted.", 404);
    }

    return jsonResponse(
      true,
      { message: "Comment deleted successfully." },
      200
    );
  } catch (error) {
    console.error("Error deleting comment:", error);
    return jsonResponse(false, "Internal server error.", 500);
  }
}
