import Comment from "@/app/models/comments";
import Posts from "@/app/models/posts";
import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";

interface ReqData {
  postId: string;
  comment: string;
  userEmail: string;
}

// Helper function to validate request data
const validateRequestData = (data: ReqData): string | null => {
  if (!data.postId) return "Post ID is required.";
  if (!data.comment) return "Comment text is required.";
  if (!data.userEmail) return "User email is required.";
  return null;
};

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const { postId, comment, userEmail }: ReqData = await req.json();
    const validationError = validateRequestData({ postId, comment, userEmail });
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    // Normalize the email address
    const normalizedEmail = userEmail.trim().toLowerCase();

    // Connect to the database
    await Connect();

    // Check if the post exists
    const post = await Posts.findById(postId);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found." },
        { status: 404 }
      );
    }

    // Check if the user exists
    const user = await User.findOne({ Email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const uniqIdUser = `${user._id}_${post._id}`;

    const newComment = new Comment({
      idPost: postId,
      CommentUserId: uniqIdUser,
      TextComment: comment,
    });

    await newComment.save();

    // If for some reason the post wasn't updated, handle gracefully
    if (!newComment) {
      return NextResponse.json(
        { success: false, message: "Failed to add comment." },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Comment added successfully.",
        newComment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
