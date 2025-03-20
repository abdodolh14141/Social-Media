import Posts from "@/app/models/posts";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { postId }: any = await req.json();

  if (!postId) {
    return new NextResponse(JSON.stringify({ message: "Invalid Post ID" }), {
      status: 400,
    });
  }

  try {
    await Connect();

    const post = await Posts.findByIdAndDelete(postId);
    if (!post) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Post not found" }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: "Post deleted successfully" }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting post with ID ${postId}:`, error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "An unexpected server error occurred.",
      }),
      { status: 500 }
    );
  }
}
