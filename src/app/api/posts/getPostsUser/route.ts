import { NextRequest, NextResponse } from "next/server";
import { Connect } from "@/dbConfig/dbConfig";
import Posts from "@/app/models/posts";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await Connect();

    // Parse the request body
    const { IdUser } = await req.json();

    // Validate the input
    if (!IdUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        { status: 400 }
      );
    }

    // Fetch posts created by the user
    const userPosts = await Posts.find({ IdUserCreated: IdUser });

    // Check if any posts exist for the user
    if (!userPosts || userPosts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No posts found for this user.",
        },
        { status: 404 }
      );
    }

    // Respond with the posts
    return NextResponse.json(
      {
        success: true,
        posts: userPosts,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log the error and respond with a generic server error message
    console.error("Error in handling POST request:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}
