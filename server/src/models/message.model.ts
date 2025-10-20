// models/Message.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage {
  conversationId: Types.ObjectId; // reference to the conversation
  senderId: string;               // ID of the sender
  content: string;                // message content
  createdAt?: Date;               // timestamp
  readBy?: string[];              // array of user IDs who have read this message
}

export interface IMessageDocument extends IMessage, Document {}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    readBy: { type: [String], default: [] }, // store user IDs who read this message
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessageDocument>("Message", MessageSchema);
