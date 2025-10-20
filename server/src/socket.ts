// socket.ts
import { Server as IOServer, Socket } from "socket.io";
import { Conversation } from "./models/conversation.model";
import { Message } from "./models/message.model";
import mongoose from "mongoose";

let io: IOServer;

export const initSocket = (server: any) => {
  io = new IOServer(server, {
    cors: {
      origin: "*", // Replace with your frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    // Setup user: join all their conversation rooms
    socket.on("setupUser", async ({ userId }) => {
      if (!userId) return;

      try {
        const conversations = await Conversation.find({ participants: userId });
        conversations.forEach((c) => {
  const conversationId = (c._id as mongoose.Types.ObjectId).toString();
  socket.join(conversationId);
});
        console.log(`User ${userId} joined ${conversations.length} rooms`);
      } catch (err) {
        console.error("Failed to setup user rooms:", err);
      }
    });

    // Join a specific conversation (for new conversation or when opening)
    socket.on("joinConversation", async ({ userId, otherUserId }) => {
      try {
        if (!userId || !otherUserId) return;

        let conversation = await Conversation.findOne({
          participants: { $all: [userId, otherUserId] },
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [userId, otherUserId],
          });
        }

        socket.join(conversation._id as string);
        socket.emit("conversationJoined", conversation._id);
        console.log(`Socket ${socket.id} joined conversation ${conversation._id}`);
      } catch (err) {
        console.error("Failed to join conversation:", err);
      }
    });

    // Handle sending message
    socket.on("sendMessage", async ({ conversationId, senderId, content }) => {
      if (!conversationId || !senderId || !content) {
        console.error("Invalid message payload", { conversationId, senderId, content });
        return;
      }

      try {
        // Save message in DB
        const message = await Message.create({ conversationId, senderId, content });

        // Update last message in conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: content,
          updatedAt: new Date(),
        });

        // Emit to all users in the conversation room
        io.to(conversationId).emit("receiveMessage", message);
        console.log(`Message sent to conversation ${conversationId}`);
      } catch (err) {
        console.error("Failed to send message:", err);
      }
    });

     // ---------------- Mark messages as read ----------------
    socket.on("markAsRead", async ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;

      try {
        // Update all unread messages in the conversation for this user
        const result = await Message.updateMany(
          { conversationId, readBy: { $ne: userId } },
          { $push: { readBy: userId } }
        );

        if (result.modifiedCount > 0) {
          // Notify all users in the room that messages are read
          io.to(conversationId).emit("messagesRead", { conversationId, userId });
          console.log(`User ${userId} read messages in conversation ${conversationId}`);
        }
      } catch (err) {
        console.error("Failed to mark messages as read:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

// Export io instance if needed in other files
export const getIO = () => io;
