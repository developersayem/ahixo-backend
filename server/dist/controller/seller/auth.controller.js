"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellerRegistrationController = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiError_1 = require("../../utils/ApiError");
const user_model_1 = require("../../models/user.model");
const ApiResponse_1 = require("../../utils/ApiResponse");
const constants_1 = require("../../constants");
const generateVerificationCode_1 = require("../../utils/generateVerificationCode");
const sendVerificationEmailByGMAIL_1 = require("../../email-templates/sendVerificationEmailByGMAIL");
// *---------------- Register Seller ----------------
exports.sellerRegistrationController = (0, asyncHandler_1.default)(async (req, res) => {
    const { fullName, email, password, phone, shopName, shopAddress } = req.body;
    if ([fullName, email, password, phone, shopName, shopAddress].some((field) => !field || field.trim() === "")) {
        throw new ApiError_1.ApiError(400, "All fields are required");
    }
    if (!email.includes("@")) {
        throw new ApiError_1.ApiError(400, "Invalid email address");
    }
    const existingUser = await user_model_1.User.findOne({ email });
    if (existingUser) {
        throw new ApiError_1.ApiError(400, "User already exists with this email");
    }
    // Generate OTP
    const verificationCode = (0, generateVerificationCode_1.generateVerificationCode)();
    const expiresAt = new Date(Date.now() + constants_1.CODE_EXPIRES_MINUTES * 60 * 1000);
    // Create seller
    const seller = await user_model_1.User.create({
        fullName,
        email,
        password,
        phone,
        role: "seller",
        emailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpires: expiresAt,
        sellerInfo: {
            shopName,
            shopAddress,
            isVerified: false,
        },
    });
    // Send verification email
    await (0, sendVerificationEmailByGMAIL_1.sendVerificationEmailByGMAIL)(email, verificationCode);
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, { email: seller.email }, "Account created. Verification code sent to your email"));
});
