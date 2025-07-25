import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // Use getServerSession instead of getSession for server-side session
import { authOptions } from "@/app/libs/auth/option";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body to get the profileImage
    const body = await req.json();
    const { profileImage } = body;

    if (!profileImage) {
      return NextResponse.json(
        { message: "Profile image is required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await Connect();

    // Get the user session
    const session = await getServerSession({
      req,
      res: NextResponse,
      ...authOptions,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized: User not logged in" },
        { status: 401 }
      );
    }

    const emailUser = session.user.email;

    // Update the user's profile image in the database
    const updatedUser = await User.findOneAndUpdate(
      { Email: emailUser },
      { UrlImageProfile: profileImage },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Image updated successfully", data: updatedUser },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating profile image:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred", error: error.message },
      { status: 500 }
    );
  }
}
