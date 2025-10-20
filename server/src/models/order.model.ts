import mongoose, { Schema, Document } from "mongoose";

// Counter schema to track order numbers per seller
const CounterSchema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  seq: { type: Number, default: 0 },
});
export const Counter = mongoose.model("Counter", CounterSchema);

// Timeline entry interface
export interface ITimelineEntry {
  status: "processing" | "delivered" | "on-hold" | "canceled" | "completed";
  timestamp: Date;
  note?: string;
  updatedBy?: mongoose.Types.ObjectId; // User who made the change
}

// Product entry interface
export interface IOrderProduct {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  title: string;
  currency?: string; // Optional for multi-currency
  shippingCost?: number;
}

// Order interface
export interface IOrder extends Document {
  orderNumber: number;
  seller: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  products: IOrderProduct[];
  subtotal: number;
  totalShippingCost: number;
  total: number;
  status: "processing" | "delivered" | "on-hold" | "canceled" | "completed";
  shippingAddress: string;
  date: Date;
  phone?: string;
  paymentMethod?: string;
  currency?: string;
  timeline: ITimelineEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// Order schema
const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: Number },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        title: { type: String, required: true },
        currency: { type: String, default: "USD" },
        shippingCost: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, required: true },
    totalShippingCost: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["processing", "delivered", "on-hold", "canceled", "completed"],
      default: "processing",
    },
    shippingAddress: { type: String, required: true },
    date: { type: Date, default: Date.now },
    phone: { type: String },
    paymentMethod: { type: String, default: "cod" },
    currency: { type: String, default: "USD" },
    timeline: [
      {
        status: {
          type: String,
          enum: ["processing", "delivered", "on-hold", "canceled", "completed"],
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook for order number assignment and timeline initialization
OrderSchema.pre<IOrder>("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { seller: this.seller },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderNumber = counter.seq;

    // Initialize timeline if empty
    if (!this.timeline || this.timeline.length === 0) {
      this.timeline = [
        {
          status: this.status,
          timestamp: new Date(),
          note: "Order created",
        },
      ];
    }
  }
  next();
});

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
