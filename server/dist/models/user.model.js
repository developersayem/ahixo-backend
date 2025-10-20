"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ---------- Schema ----------
const UserSchema = new mongoose_1.Schema({
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
    wishlist: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Product" }],
    cart: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Product" }],
    orders: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Order" }],
    emailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String, default: "" },
    emailVerificationCodeExpires: { type: Date, default: null },
    refreshToken: { type: String },
}, { timestamps: true });
// ---------- Pre-save Hooks ----------
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcrypt_1.default.hash(this.password, 10);
    next();
});
// ---------- Instance Methods ----------
UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt_1.default.compare(password, this.password);
};
UserSchema.methods.generateAccessToken = function () {
    const expiresIn = (process.env.JWT_ACCESS_TOKEN_EXPIRY || "1h");
    return jsonwebtoken_1.default.sign({ _id: this._id, email: this.email, role: this.role }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn });
};
UserSchema.methods.generateRefreshToken = function () {
    const expiresIn = (process.env.JWT_REFRESH_TOKEN_EXPIRY || "7d");
    return jsonwebtoken_1.default.sign({ _id: this._id }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn });
};
// ---------- Export Model ----------
exports.User = mongoose_1.default.model("User", UserSchema);
