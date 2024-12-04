"use server";

import Comment from "@/app/models/comments";
import Posts from "@/app/models/posts";
import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";

interface reqData {
  postId: String;
  comment: String;
  userEmail: String;
}

export default async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { success: false, message: "Method not allowed" },
      { status: 405 }
    );
  }

  const { postId, comment, userEmail }: reqData = await req.body();

  if (!postId || !comment || !userEmail) {
    return NextResponse.json(
      { success: false, message: "Invalid data" },
      { status: 400 }
    );
  }

  try {
    await Connect();
    const post = await Posts.findById(postId);
    const UserIsExist = await User.findOne({ Email: userEmail });

    if (!post && UserIsExist) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    const newComment = new Comment({
      idPost: postId,
      CommentUserId: UserIsExist._id,
      TextComment: comment,
    });

    await newComment.save();

    return NextResponse.json(
      { success: true, message: "Success Add Comment", comment: newComment },
      { status: 200 }
    );
  } catch (error) {
    NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
