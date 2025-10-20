import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ---------- TypeScript Interfaces ----------
export interface IAddress {
  street?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface ISellerInfo {
  shopName: string;
  shopAddress: string;
  shopDescription?: string;
  rating?: number;
  totalSales?: number;
  isVerified?: boolean;
  documents?: string[];
}

export interface IUserProps {
  fullName: string;
  email: string;
  avatar?: string;
  phone: string;
  password: string;
  role: "buyer" | "seller" | "admin";
  address?: IAddress;
  sellerInfo?: ISellerInfo;
  refreshToken?: string;

  // Buyer-specific
  wishlist?: mongoose.Types.ObjectId[];
  cart?: mongoose.Types.ObjectId[];
  orders?: mongoose.Types.ObjectId[];

  // OTP / Verification
  emailVerified?: boolean;              // Has email been verified?
  emailVerificationCode?: string;       // OTP code for email
  emailVerificationCodeExpires?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

// Combined type for the Mongoose Document
export type IUserDocument = Document<unknown, {}, IUserProps> & IUserProps & IUserMethods;

// Optional: Model type if we want static methods
export type IUserModel = Model<IUserDocument>;

// ---------- Schema ----------
const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    fullName: { type: String, required: true },
    avatar: { type: String, default: "/default-avatar.png" },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
    address: {
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },
    sellerInfo: {
      shopName: String,
      shopAddress: String,
      shopDescription: String,
      rating: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      isVerified: { type: Boolean, default: false },
      documents: [String],
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    
    emailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String, default: "" },
    emailVerificationCodeExpires: { type: Date, default: null },

    refreshToken: { type: String },
  },
  { timestamps: true }
);

// ---------- Pre-save Hooks ----------
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ---------- Instance Methods ----------
UserSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  const expiresIn = (process.env.JWT_ACCESS_TOKEN_EXPIRY || "1h") as `${number}${"s" | "m" | "h" | "d"}`;
  return jwt.sign({ _id: this._id, email: this.email, role: this.role }, process.env.JWT_ACCESS_TOKEN_SECRET!, { expiresIn });
};

UserSchema.methods.generateRefreshToken = function () {
  const expiresIn = (process.env.JWT_REFRESH_TOKEN_EXPIRY || "7d") as `${number}${"s" | "m" | "h" | "d"}`;
  return jwt.sign({ _id: this._id }, process.env.JWT_REFRESH_TOKEN_SECRET!, { expiresIn });
};

// ---------- Export Model ----------
export const User = mongoose.model<IUserDocument, IUserModel>("User", UserSchema);
