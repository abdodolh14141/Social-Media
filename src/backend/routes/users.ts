import { Elysia, t } from "elysia";
import mongoose from "mongoose";
import User from "../../app/models/userModel";
import Followers from "../../app/models/followers";
import Report from "../../app/models/report";
import Reset from "../../app/models/resetSchema";
import { Connect } from "../../dbConfig/dbConfig";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getToken } from "next-auth/jwt";

// Auth helper
async function validateAuth(request: Request) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return token;
}

export const usersRoutes = new Elysia({ prefix: "/api/users" })
  .onBeforeHandle(async () => {
    await Connect();
  })
  // Get Current Session
  .get("/session", async ({ request }) => {
    const token = await validateAuth(request);
    return { session: token };
  })
  .get("/getUsers", async ({ request }) => {
    try {
      const users = await User.find();
      return { success: true, message: "Users fetched successfully", users };
    } catch (error) {
      return { success: false, message: error };
    }
  })
  // Add Follow
  .post("/AddFollow", async ({ body, set }: any) => {
    try {
      const { FollowByEmail, AccountId } = body;
      if (!FollowByEmail || !AccountId) {
        set.status = 400;
        return { success: false, message: "Missing required fields." };
      }

      const checkUserAccount = await User.findById(AccountId);
      const checkUserFollow = await User.findOne({ Email: FollowByEmail });
      if (!checkUserAccount || !checkUserFollow) {
        set.status = 404;
        return { success: false, message: "Target user not found." };
      }

      const followers = checkUserFollow.Followers || [];
      const isFollowing = followers.includes(FollowByEmail);
      let action: "follow" | "unfollow";

      if (isFollowing) {
        await User.findByIdAndUpdate(
          AccountId,
          {
            $pull: { Followers: FollowByEmail },
            $inc: { Follow: -1 },
          },
          { new: true },
        );
        action = "unfollow";
      } else {
        await User.findByIdAndUpdate(
          AccountId,
          {
            $addToSet: { Followers: FollowByEmail },
            $inc: { Follow: 1 },
          },
          { new: true },
        );
        action = "follow";
      }

      return {
        success: true,
        message: `Successfully ${action}ed the user.`,
        action,
      };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, message: "Server error." };
    }
  })
  // Image Profile (Auth Required)
  .post("/ImgProfile", async ({ request, body, set }: any) => {
    try {
      const { profileImage } = body;
      if (!profileImage) {
        set.status = 400;
        return { message: "Profile image is required" };
      }

      const session = await validateAuth(request);
      if (!session || !session.email) {
        set.status = 401;
        return { message: "Unauthorized" };
      }
      const emailUser = session.email;

      const updatedUser = await User.findOneAndUpdate(
        { Email: emailUser },
        { UrlImageProfile: profileImage },
        { new: true },
      );

      if (!updatedUser) {
        set.status = 404;
        return { message: "User not found" };
      }
      return { message: "Image updated successfully", data: updatedUser };
    } catch (error: any) {
      set.status = 500;
      return { message: "Server error", error: error.message };
    }
  })
  // Get Followers
  .post("/getFollowers", async ({ body, set }: any) => {
    try {
      const { AccountId: id } = body;
      const searchUser = await User.findById(id);
      if (searchUser) {
        return { success: true, followers: searchUser.Followers };
      }
      set.status = 200;
      return { success: false, message: "No followers found" };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  // Register
  .post("/register", async ({ body, set }: any) => {
    try {
      const { username, email, age, gender, password } = body;
      if (!username || !email || !age || !gender || !password) {
        return { success: false, message: "All fields are required." };
      }

      const existingUser = await User.findOne({ Email: email });
      if (existingUser) {
        return { success: false, message: "User already exists." };
      }

      const hashPass = await bcrypt.hash(password, 10);
      const newUser = new User({
        Name: username,
        Email: email,
        Age: age,
        Gender: gender,
        Followers: [],
        Password: hashPass,
      });
      await newUser.save();

      return {
        success: true,
        message: "Account created successfully",
        data: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      };
    } catch (error: any) {
      return { success: false, message: `Server error: ${error.message}` };
    }
  })
  // Report
  .post("/report", async ({ body, set }: any) => {
    try {
      const { email, message } = body;
      // validation omitted for brevity but recommended
      const report = new Report({
        ReportMsg: message?.trim(),
        Email: email?.trim(),
      });
      await report.save();
      return { success: true, message: "Successfully saved the report" };
    } catch (error) {
      set.status = 500;
      return { success: false, message: "Failed to save report" };
    }
  })
  // Reset Password
  .post("/resetPassword", async ({ body, set }: any) => {
    try {
      const { email, token, password } = body;
      // validation checks...
      if (!token || !email || !password) {
        set.status = 400;
        return { message: "Missing fields" };
      }

      const user = await User.findOne({ Email: email });
      if (!user) {
        set.status = 400;
        return { error: "Invalid token" };
      }

      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const record = await Reset.findOne({
        userId: user._id,
        tokenHash,
        used: false,
      });

      if (!record || record.expiresAt < new Date()) {
        set.status = 400;
        return { error: "Invalid or expired token" };
      }

      const passwordHash = await bcrypt.hash(password, 12);
      user.Password = passwordHash;
      // Original code: user.passwordHash = passwordHash; (Fixed to match User model)
      await user.save();

      record.used = true;
      await record.save();

      return { ok: true };
    } catch (error) {
      set.status = 500;
      return { message: "Server error" };
    }
  })
  // Search Profile
  .post("/searchProfile", async ({ body, set }: any) => {
    try {
      const { id: IdUser } = body;
      if (!IdUser) {
        set.status = 400;
        return { success: false, message: "User ID not provided" };
      }
      const existUser = await User.findById(IdUser);
      const followers = await Followers.find({ idUser: IdUser }); // Assuming Followers model usage

      if (!existUser) {
        set.status = 404;
        return { success: false, message: "User not found" };
      }
      if (!followers || followers.length === 0) {
        set.status = 200;
        return {
          success: true,
          message: "Followers not found",
          user: existUser,
        };
      }
      return {
        success: true,
        message: "User found successfully",
        user: existUser,
        Followers: followers,
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: `Server error: ${error.message}` };
    }
  })
  // Search Users
  .post("/searchUsers", async ({ body, set }: any) => {
    try {
      const { name } = body;
      if (!name || typeof name !== "string" || !name.trim()) {
        set.status = 400;
        return { success: false, message: "Invalid name" };
      }
      const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const users = await User.find({
        Name: { $regex: new RegExp(escapedName, "i") },
      });
      if (!users || users.length === 0) {
        set.status = 404;
        return { success: false, message: "No users found" };
      }
      return { success: true, message: "User(s) found", user: users };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: `Server error: ${error.message}` };
    }
  });
