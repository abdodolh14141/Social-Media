import { NextRequest, NextResponse } from "next/server";
import { Connect } from "@/dbConfig/dbConfig";
import Comment from "@/app/models/comments";
import { z } from "zod";

// --- Type Definitions ---
interface CommentDocument {
  _id: string;
  postId: string;
  userId: string;
  textComment: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Validation Schemas ---
const deleteCommentSchema = z.object({
  commentId: z.string().min(1, "Comment ID is required"),
});

// --- Helper Functions ---
const createErrorResponse = (message: string, status: number = 500) => {
  console.error(`API Error (${status}):`, message);
  return NextResponse.json({ success: false, message }, { status });
};

const createSuccessResponse = <T>(data: T, message?: string) => {
  return NextResponse.json({
    success: true,
    ...(message && { message }),
    ...data,
  });
};

// --- Database Connection Wrapper ---
const withDbConnection = async <T>(handler: () => Promise<T>): Promise<T> => {
  try {
    await Connect();
    return await handler();
  } catch (error) {
    throw error;
  }
};

// --- GET: Fetch All Comments ---
export async function GET(req: NextRequest) {
  try {
    const comments = await withDbConnection(async () => {
      return await Comment.find<CommentDocument>({})
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    });

    return createSuccessResponse({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return createErrorResponse(
      "Failed to fetch comments. Please try again later.",
      500
    );
  }
}

// --- DELETE: Remove a Comment ---
export async function DELETE(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json().catch(() => null);

    if (!body) {
      return createErrorResponse("Invalid request body", 400);
    }

    const validation = deleteCommentSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        validation.error.errors[0]?.message || "Invalid comment ID",
        400
      );
    }

    const { commentId } = validation.data;

    // Delete comment within database connection
    const result = await withDbConnection(async () => {
      const deletedComment = await Comment.findByIdAndDelete({ _id: commentId })
        .lean()
        .exec();

      if (!deletedComment) {
        throw new Error("COMMENT_NOT_FOUND");
      }

      return deletedComment;
    });

    return createSuccessResponse({ commentId }, "Comment deleted successfully");
  } catch (error) {
    console.error("Error deleting comment:", error);

    if (error instanceof Error && error.message === "COMMENT_NOT_FOUND") {
      return createErrorResponse("Comment not found", 404);
    }

    return createErrorResponse(
      "Failed to delete comment. Please try again later.",
      500
    );
  }
}

// --- POST: Add a New Comment ---
const createCommentSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be 500 characters or less"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return createErrorResponse("Invalid request body", 400);
    }

    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        validation.error.errors[0]?.message || "Invalid comment data",
        400
      );
    }

    const { postId, userId, name, comment: textComment } = validation.data;

    const newComment = await withDbConnection(async () => {
      const comment = await Comment.create({
        postId,
        userId,
        name,
        textComment,
      });

      return comment.toObject();
    });

    return createSuccessResponse(
      { comment: newComment },
      "Comment added successfully"
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return createErrorResponse(
      "Failed to add comment. Please try again later.",
      500
    );
  }
}
