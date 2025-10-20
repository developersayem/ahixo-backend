"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserConversations = void 0;
const conversation_model_1 = require("../../models/conversation.model");
const message_model_1 = require("../../models/message.model");
const mongoose_1 = __importDefault(require("mongoose"));
const getUserConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        // Simple find query
        const conversations = await conversation_model_1.Conversation.find({
            participants: userId
        }).sort({ updatedAt: -1 });
        // Populate user data separately
        const data = await Promise.all(conversations.map(async (conv) => {
            // Get other participants
            const otherParticipantIds = conv.participants.filter(p => p !== userId);
            // Find user details for other participants
            const otherUsers = await mongoose_1.default.model('User').find({
                _id: { $in: otherParticipantIds }
            }).select('fullName avatar email');
            const lastMsg = await message_model_1.Message.findOne({ conversationId: conv._id })
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
        }));
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getUserConversations = getUserConversations;
