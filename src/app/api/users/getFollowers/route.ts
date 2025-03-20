import User from "@/app/models/userModel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { AccountId: id } = await req.json();
    const searchUser = await User.findById(id);
    if (searchUser) {
      return NextResponse.json(
        { success: true, followers: searchUser.Followers },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
