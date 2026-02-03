import { Elysia, t } from "elysia";
import mongoose from "mongoose";
import Message from "../../app/models/messageModel";
import { Connect } from "../../dbConfig/dbConfig";
import { getToken } from "next-auth/jwt";
import { Server } from "socket.io";
import User from "../../app/models/userModel";

export const createMessagesRoutes = (io: Server | null | undefined) =>
  new Elysia({ prefix: "/api/messages" })
    // 1. Centralized Connection and Auth
    .onBeforeHandle(async () => {
      await Connect();
    })
    .derive(async ({ request }) => {
      const token = await getToken({
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token || !token.email) return { user: null };

      let userId = token.id;
      if (!mongoose.Types.ObjectId.isValid(userId as string)) {
        const user = await User.findOne({ Email: token.email }).select("_id");
        userId = user?._id.toString() || null;
      }

      return { userId };
    })
    // 2. Guard: All routes below this require a valid user
    .guard({
      beforeHandle: ({ userId, set }) => {
        if (!userId) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
      },
    })
    // GET /unread
    .get("/unread", async ({ userId }) => {
      const unreadCount = await Message.countDocuments({
        recipient: userId,
        read: false,
      });
      return { unreadCount };
    })
    // POST / (Send Message)
    .post(
      "/",
      async ({ body, userId, set }) => {
        const { recipient, content } = body;

        const newMessage = await Message.create({
          sender: userId, // Use verified userId from derive
          recipient,
          content,
        });

        if (io) {
          io.to(recipient).emit("new-message", newMessage);
          // Also notify the recipient to update their unread badge count
          io.to(recipient).emit("update-unread-count");
        }

        set.status = 201;
        return { message: "Message sent", data: newMessage };
      },
      {
        body: t.Object({
          recipient: t.String(),
          content: t.String({ minLength: 1 }),
        }),
      },
    )
    // GET /conversations
    .get("/conversations", async ({ userId }) => {
      const userObjId = new mongoose.Types.ObjectId(userId!);

      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: userObjId }, { recipient: userObjId }],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [{ $eq: ["$sender", userObjId] }, "$recipient", "$sender"],
            },
            lastMessage: { $first: "$$ROOT" },
          },
        },
        {
          $addFields: {
            // Ensure the ID is an ObjectId for the lookup
            userLookUpId: { $toObjectId: "$_id" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userLookUpId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            "userDetails.Name": {
              $ifNull: ["$userDetails.Name", "Unknown User"],
            },
            "userDetails.Email": 1,
            "userDetails.image": 1,
            "lastMessage.content": 1,
            "lastMessage.createdAt": 1,
            "lastMessage.read": 1,
            "lastMessage.sender": 1,
          },
        },
        { $sort: { "lastMessage.createdAt": -1 } },
      ]);

      return { conversations };
    })
    // GET /:id (Fetch messages between two users)
    .get(
      "/:id",
      async ({ params: { id }, userId }) => {
        const messages = await Message.find({
          $or: [
            { sender: userId, recipient: id },
            { sender: id, recipient: userId },
          ],
        }).sort({ createdAt: 1 });

        // Clean up: Mark as read
        await Message.updateMany(
          { sender: id, recipient: userId, read: false },
          { $set: { read: true } },
        );

        return { messages };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      },
    );
