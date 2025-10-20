import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  sellerId:mongoose.Types.ObjectId
  product: mongoose.Types.ObjectId;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  customOptions?: Record<string, string>;
}

export interface ICart extends Document {
  buyer: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quantity: { type: Number, default: 1, min: 1 },
     // Add extra fields selected by user
    selectedColor: { type: String },
    selectedSize: { type: String },
    customOptions: { type: Map, of: String }, // for any other dynamic options
  },
  { _id: true }
);

const CartSchema = new Schema<ICart>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
