import mongoose, { Schema, Document } from "mongoose";

export interface ISellerApplication extends Document {
  user: mongoose.Types.ObjectId;
  documents: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
}

const SellerApplicationSchema: Schema = new Schema<ISellerApplication>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  documents: [{ type: String }],
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
});

export default mongoose.model<ISellerApplication>("Seller-Application", SellerApplicationSchema);
