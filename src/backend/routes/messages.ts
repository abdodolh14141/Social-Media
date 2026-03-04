import { Elysia, t } from "elysia";
import mongoose from "mongoose";
import Message from "../../app/models/messageModel";
import { Connect } from "../../dbConfig/dbConfig";
import { getToken } from "next-auth/jwt";
import { Server } from "socket.io";

export const createMessagesRoutes = (io: Server | null | undefined) =>
  new Elysia({ prefix: "/api/messages" })
    .onBeforeHandle(async () => {
      await Connect();
    })
    .derive(async ({ request }) => {
      const token = await getToken({
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) return { userId: null, userName: null };

      // Use token data directly to avoid DB overhead on every request
      const userId = token.id || token.sub;
      const userName = token.name || "User";

      return { userId, userName };
    })
    .guard({
      beforeHandle: ({ userId, set }) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
          set.status = 401;
          return { error: "Unauthorized: Invalid or missing User ID" };
        }
      },
    })
    .post("/", async ({ body, userId, userName, set }) => {
      const { recipient, content } = body;

      try {
        // Optimized: create and return the message in one go
        const newMessage = await Message.create({
          senderId: userId,
          recipientId: recipient,
          nameSender: userName,
          content: content.trim(),
        });

        if (io) {
          // Emit to both to keep both UI's in sync immediately
          io.to(recipient).emit("new-message", newMessage);
          io.to(userId!.toString()).emit("message-sent", newMessage);
        }

        set.status = 201;
        return newMessage;
      } catch (error) {
        set.status = 500;
        return { error: "Failed to send message" };
      }
    },
      {
        body: t.Object({
          recipient: t.String(),
          content: t.String({ minLength: 1, maxLength: 2000 }),
        }),
      }
    )
    .get("/conversations", async ({ userId }) => {
      const userObjId = new mongoose.Types.ObjectId(userId!);

      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [{ senderId: userObjId }, { recipientId: userObjId }],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$senderId", userObjId] },
                "$recipientId",
                "$senderId",
              ],
            },
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ["$recipientId", userObjId] }, { $eq: ["$read", false] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: "socialusers",
            localField: "_id",
            foreignField: "_id",
            as: "contact",
          },
        },
        { $unwind: "$contact" },
        {
          $project: {
            _id: 1,
            unreadCount: 1,
            contactName: "$contact.Name",
            contactImage: "$contact.image",
            lastMessage: 1,
          },
        },
        { $sort: { "lastMessage.createdAt": -1 } },
      ]);

      return { conversations, currentUserId: userId };
    })
    .get("/:id", async ({ userId, params }) => {
      const userObjId = new mongoose.Types.ObjectId(userId!);
      const otherObjId = new mongoose.Types.ObjectId(params.id);

      // Fetch ALL messages between these two users, sorted oldest-first
      const messages = await Message.find({
        $or: [
          { senderId: userObjId, recipientId: otherObjId },
          { senderId: otherObjId, recipientId: userObjId },
        ],
      }).sort({ createdAt: 1 }).lean();

      // Mark unread messages from the other user as read
      await Message.updateMany(
        { senderId: otherObjId, recipientId: userObjId, read: false },
        { $set: { read: true } },
      );

      return { messages, currentUserId: userId };
    });