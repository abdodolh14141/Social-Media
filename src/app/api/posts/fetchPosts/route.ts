import { NextRequest, NextResponse } from "next/server";
import { Connect } from "@/dbConfig/dbConfig";
import Posts from "@/app/models/posts";

// Type for Post document
interface PostType {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  await Connect();

  try {
    const posts = await Posts.find<PostType>({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, posts });
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
