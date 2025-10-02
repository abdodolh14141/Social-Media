import { NextRequest, NextResponse } from "next/server";
import { Connect } from "@/dbConfig/dbConfig";
import Comment from "@/app/models/comments";
import { faCommentMedical } from "@fortawesome/free-solid-svg-icons";

// Type for Post document
interface CommentType {
  idPost: string;
  CommentUserId: string;
  TextComment: string;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  await Connect();

  try {
    const comments = await Comment.find<CommentType>({})
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("Error in GET posts handler:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await Connect();
    const data = await req.json();
    // Find the comment first
    const comment = await Comment.findById(data.commentId).lean();
    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          message: "Comment Not Found",
        },
        { status: 404 }
      );
    }

    await Comment.findByIdAndDelete(data.commentId);
    return NextResponse.json({
      success: true,
      message: "Comment Deleted Successfully",
    });
  } catch (error) {
    console.error("Error in DELETE posts handler:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}
