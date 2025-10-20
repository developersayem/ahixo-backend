// models/Conversation.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IConversation {
  participants: string[]; // user IDs
  lastMessage?: string;
  updatedAt?: Date;
}

export interface IConversationDocument extends IConversation, Document {}

const ConversationSchema = new Schema<IConversationDocument>({
  participants: { type: [String], required: true },
  lastMessage: { type: String, default: "" },
}, { timestamps: true });

export const Conversation = mongoose.model<IConversationDocument>("Conversation", ConversationSchema);
