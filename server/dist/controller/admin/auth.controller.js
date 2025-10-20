"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = exports.adminRegistrationController = void 0;
const cookieOptions_1 = require("../../utils/cookieOptions");
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiError_1 = require("../../utils/ApiError");
const user_model_1 = require("../../models/user.model");
const ApiResponse_1 = require("../../utils/ApiResponse");
const constants_1 = require("../../constants");
const generateVerificationCode_1 = require("../../utils/generateVerificationCode");
const generateAccessTokenAndRefreshToken_1 = require("../../helper/generateAccessTokenAndRefreshToken");
const sendVerificationEmailByGMAIL_1 = require("../../email-templates/sendVerificationEmailByGMAIL");
// *---------------- Register Admin ----------------
exports.adminRegistrationController = (0, asyncHandler_1.default)(async (req, res) => {
    const { fullName, email, password, phone, shopName, shopAddress } = req.body;
    console.log({ fullName, email, password, phone, shopName, shopAddress });
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
    // Create admin
    const admin = await user_model_1.User.create({
        fullName,
        email,
        password,
        phone,
        role: "admin",
        emailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpires: expiresAt,
    });
    // Send verification email
    await (0, sendVerificationEmailByGMAIL_1.sendVerificationEmailByGMAIL)(email, verificationCode);
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, { email: admin.email }, "Account created. Verification code sent to your email"));
});
exports.loginController = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        throw new ApiError_1.ApiError(400, "Email and password required");
    const user = await user_model_1.User.findOne({ email, role: "admin" });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    const isValid = await user.isPasswordCorrect(password);
    if (!isValid)
        throw new ApiError_1.ApiError(401, "Invalid credentials");
    if (!user.emailVerified)
        throw new ApiError_1.ApiError(401, "Email not verified");
    // Generate tokens
    const { accessToken, refreshToken } = await (0, generateAccessTokenAndRefreshToken_1.generateAccessTokenAndRefreshToken)(user._id);
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();
    // Prepare user data without sensitive fields
    const safeUser = {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
    // Send response with cookies
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions_1.cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions_1.cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, safeUser, "Login successful"));
});
