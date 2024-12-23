import { NextRequest, NextResponse } from "next/server";
import { Connect } from "@/dbConfig/dbConfig";
import Comment from "@/app/models/comments";

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
