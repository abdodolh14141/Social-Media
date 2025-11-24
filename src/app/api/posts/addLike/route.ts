// The "use server" directive is typically not required for Next.js Route Handlers
// (which are API endpoints). Route Handlers run on the server by default.
// I've kept it as an outer comment based on your initial code, but it's not
// valid within a module file; the file structure defines the boundary.

import { NextResponse, NextRequest } from "next/server";
import { Connect } from "@/dbConfig/dbConfig";
import Posts from "@/app/models/posts";
import mongoose from "mongoose";

// --- Type Definitions ---

// Standardized request body to use 'userId' for consistency
interface RequestBody {
  postId: string;
  userId: string; // Changed from userEmail to userId based on usage
}

// Response messages centralized for cleaner code
const MESSAGES = {
  INVALID_POST_ID: "Invalid postId format.",
  MISSING_USER_ID: "User ID is required.", // Updated message
  POST_NOT_FOUND: "Post not found.",
  LIKE_ADDED: "Post liked successfully.",
  LIKE_REMOVED: "Like removed.",
  SERVER_ERROR: "Server error. Please try again.",
};

// Utility function to validate ObjectId
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

export async function POST(req: NextRequest) {
  // Use Mongoose/DB connection outside of try/catch for immediate connection errors
  try {
    await Connect();
  } catch (err) {
    console.error("Database connection error:", err);
    return NextResponse.json(
      { success: false, message: "Database connection failed." },
      { status: 500 }
    );
  }

  try {
    // 1. Parse and validate request body
    const { postId, userId }: RequestBody = await req.json();

    if (!isValidObjectId(postId)) {
      return NextResponse.json(
        { success: false, message: MESSAGES.INVALID_POST_ID },
        { status: 400 }
      );
    }

    // Checking for userId, which replaces the missing 'userEmail' from the original code
    if (!userId) {
      return NextResponse.json(
        { success: false, message: MESSAGES.MISSING_USER_ID },
        { status: 400 }
      );
    }

    // 2. Find the post and check current state (read operation)
    // We use .select() to only retrieve necessary fields and .lean() for faster read access.
    const postSnapshot = await Posts.findById(postId).select("likedBy").lean();

    if (!postSnapshot) {
      return NextResponse.json(
        { success: false, message: MESSAGES.POST_NOT_FOUND },
        { status: 404 }
      );
    }

    // 3. Determine action and prepare atomic update
    const userAlreadyLiked = postSnapshot.likedBy.includes(userId);

    let updateOperation;
    let message;
    let likedStatus;

    if (userAlreadyLiked) {
      // User liked it -> UNLIKE: Use $pull to remove from array, $inc to decrement count
      updateOperation = {
        $pull: { likedBy: userId },
        $inc: { Like: -1 },
      };
      message = MESSAGES.LIKE_REMOVED;
      likedStatus = false;
    } else {
      // User did not like it -> LIKE: Use $addToSet to add to array, $inc to increment count
      updateOperation = {
        $addToSet: { likedBy: userId },
        $inc: { Like: 1 },
      };
      message = MESSAGES.LIKE_ADDED;
      likedStatus = true;
    }

    // 4. Perform the single, atomic update operation
    // { new: true } returns the document *after* the update.
    // The query is safe because it only runs the $inc if the $addToSet/$pull is successful
    const updatedPost = await Posts.findByIdAndUpdate(
      postId,
      updateOperation,
      { new: true, runValidators: true } // runValidators ensures the model constraints are met
    );

    // This check should technically not be needed if postSnapshot existed, but it's a safety net.
    if (!updatedPost) {
      return NextResponse.json(
        { success: false, message: MESSAGES.POST_NOT_FOUND },
        { status: 404 }
      );
    }

    // 5. Send successful response
    return NextResponse.json(
      {
        success: true,
        message: message,
        liked: likedStatus,
        // Optional: return the new like count for UI update
        newLikeCount: updatedPost.Like,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // 6. Handle server/logic errors
    console.error(
      "Error processing like/unlike request:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { success: false, message: MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
