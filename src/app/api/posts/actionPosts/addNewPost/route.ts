import Posts from "@/app/models/posts";
import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handler for creating a new post.
 * @param req - The Next.js request object.
 * @returns - A NextResponse object.
 */
export async function POST(req: NextRequest) {
  try {
    // Establish a database connection
    await Connect();

    // Parse request body
    const { title, content, ImageId, authorEmail } = await req.json();

    // Input validation
    if (!title || !content || !ImageId || !authorEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All fields are required: title, content, image, and author email.",
        },
        { status: 400 }
      );
    }

    // Ensure the user exists
    const user = await User.findOne({ Email: authorEmail });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found. Please verify the email address.",
        },
        { status: 404 }
      );
    }

    // Create a new post document
    const newPost = await Posts.create({
      IdUserCreated: user._id,
      Title: title.trim(),
      Content: content.trim(),
      AuthorName: user.Name || "Anonymous",
      PublicImage: ImageId.trim(),
    });

    // Successful creation response
    return NextResponse.json(
      {
        success: true,
        message: "Post created successfully.",
        post: newPost,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating post:", error.message || error);

    // Handle specific MongoDB or validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data provided. Please check your inputs.",
          details: error.errors,
        },
        { status: 422 }
      );
    }

    // General error response
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while creating the post.",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
