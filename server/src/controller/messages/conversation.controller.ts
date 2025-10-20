import { Request, Response } from "express";
import { Conversation } from "../../models/conversation.model";
import { Message } from "../../models/message.model";
import mongoose from "mongoose";

export const getUserConversations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // Simple find query
    const conversations = await Conversation.find({ 
      participants: userId 
    }).sort({ updatedAt: -1 });

    // Populate user data separately
    const data = await Promise.all(
      conversations.map(async (conv) => {
        // Get other participants
        const otherParticipantIds = conv.participants.filter(p => p !== userId);
        
        // Find user details for other participants
        const otherUsers = await mongoose.model('User').find({
          _id: { $in: otherParticipantIds }
        }).select('fullName avatar email');

        const lastMsg = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .lean();

        return {
          _id: conv._id,
          participants: conv.participants,
          otherUser: otherUsers[0] || { fullName: "Unknown", avatar: "" },
          messages: [],
          lastMessage: lastMsg,
          unreadCount: 0,
          updatedAt: conv.updatedAt,
        };
      })
    );

    res.json(data);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error" });
  }
};