import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  seller: mongoose.Types.ObjectId;
  title: string;
  description: string;
  currency?: string;
  price: number;
  salePrice?: number;
  stock: number;
  inHouseProduct?: boolean;
  warranty?: boolean;
  colors?: string[];
  images: string[];
  tags: string[];
  features?: string[];
  category: string;
  brand?: string;
  isFlashSale?: boolean;
  shippingCost?: number;
  ratings?: { user: mongoose.Types.ObjectId; rating: number }[]; // new
  rating?: number; // average rating
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isFlashSale: { type: Boolean, default: false },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    stock: { type: Number, default: 0 },
    inHouseProduct: { type: Boolean, default: false },
    images: [{ type: String, required: true }],
    tags: [{ type: String }],
    features: [{ type: String }],
    category: { type: String, required: true },
    brand: { type: String },
    warranty: { type: Boolean, default: false },
    colors: [{ type: String }],
    shippingCost: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    ratings: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 0, max: 5 },
      },
    ],
    rating: { type: Number, default: 0 }, // average rating
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
