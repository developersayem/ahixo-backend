"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = void 0;
const message_model_1 = require("../../models/message.model");
// Get all messages for a conversation
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await message_model_1.Message.find({ conversationId }).sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getMessages = getMessages;
