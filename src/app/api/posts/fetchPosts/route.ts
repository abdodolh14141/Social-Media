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

export async function GET() {
  await Connect();

  try {
    const posts = await Posts.find<PostType>({}).sort({ createdAt: -1 }).lean();
    if (posts.length === 0) {
      return NextResponse.json({ success: true, posts });
    }
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

export async function DELETE(req: NextRequest) {
  try {
    await Connect();
    const jsonData = await req.json(); // Parse the request body
    const { idPost } = jsonData; // Destructure the ID from the parsed data

    if (!idPost) {
      return NextResponse.json(
        { success: false, message: "Post ID is required." },
        { status: 400 }
      );
    }

    const post = await Posts.findByIdAndDelete(idPost); // Use the ID directly

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
