"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendOTP = exports.verifyEmail = exports.changePasswordController = exports.logoutUser = exports.getCurrentUserController = exports.loginController = void 0;
const user_model_1 = require("../../models/user.model");
const ApiError_1 = require("../../utils/ApiError");
const ApiResponse_1 = require("../../utils/ApiResponse");
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const cookieOptions_1 = require("../../utils/cookieOptions");
const generateVerificationCode_1 = require("../../utils/generateVerificationCode");
const sendVerificationEmailByGMAIL_1 = require("../../email-templates/sendVerificationEmailByGMAIL");
const generateAccessTokenAndRefreshToken_1 = require("../../helper/generateAccessTokenAndRefreshToken");
// ---------------- Buyer Login Controller ----------------
exports.loginController = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        throw new ApiError_1.ApiError(400, "Email and password required");
    const user = await user_model_1.User.findOne({
        email,
        role: { $in: ["buyer", "seller"] },
    });
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
        address: user.address,
        sellerInfo: user.sellerInfo,
        wishlist: user.wishlist,
        cart: user.cart,
        orders: user.orders
    };
    // Send response with cookies
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions_1.cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions_1.cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, safeUser, "Login successful"));
});
// *---------------- Get Current User ----------------
exports.getCurrentUserController = (0, asyncHandler_1.default)(async (req, res) => {
    // Assuming your authentication middleware sets req.userId
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const user = await user_model_1.User.findById(userId).select("-password -refreshToken");
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    res.json(new ApiResponse_1.ApiResponse(200, {
        user,
    }));
});
// *---------------- Logout ----------------
exports.logoutUser = (0, asyncHandler_1.default)(async (req, res) => {
    const authenticatedReq = req;
    await user_model_1.User.findByIdAndUpdate(authenticatedReq.user._id, { $set: { refreshToken: "" } }, { new: true });
    res
        .status(200)
        .clearCookie("accessToken", cookieOptions_1.cookieOptions)
        .clearCookie("refreshToken", cookieOptions_1.cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, {}, "User logged out successfully"));
});
// *---------------- Change Password ----------------
exports.changePasswordController = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    // Validate input
    if (!email || !oldPassword || !newPassword) {
        throw new ApiError_1.ApiError(400, "Email, old password, and new password are required");
    }
    if (newPassword.length < 6) {
        throw new ApiError_1.ApiError(400, "New password must be at least 6 characters long");
    }
    // Find user
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    // Verify old password
    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (!isMatch)
        throw new ApiError_1.ApiError(400, "Old password is incorrect");
    // Update password
    user.password = newPassword;
    await user.save();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "Password changed successfully"));
});
// *---------------- Verify Email ----------------
exports.verifyEmail = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, code } = req.body;
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    if (user.emailVerificationCode !== code || !user.emailVerificationCodeExpires) {
        throw new ApiError_1.ApiError(400, "Invalid or expired code");
    }
    if (user.emailVerificationCodeExpires < new Date()) {
        throw new ApiError_1.ApiError(400, "Code expired");
    }
    user.emailVerified = true;
    user.emailVerificationCode = "";
    user.emailVerificationCodeExpires = null;
    await user.save();
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "Email verified successfully"));
});
// *---------------- Resend OTP with per-user cool down----------------
exports.resendOTP = (0, asyncHandler_1.default)(async (req, res) => {
    const { email } = req.body;
    if (!email)
        throw new ApiError_1.ApiError(400, "Email is required");
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    // Prevent spamming: check if previous OTP is still valid
    const now = new Date();
    if (user.emailVerificationCodeExpires && user.emailVerificationCodeExpires > now) {
        const secondsLeft = Math.ceil((user.emailVerificationCodeExpires.getTime() - now.getTime()) / 1000);
        throw new ApiError_1.ApiError(429, `Please wait ${secondsLeft} seconds before requesting a new code`);
    }
    // Generate new OTP
    const verificationCode = (0, generateVerificationCode_1.generateVerificationCode)();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationCodeExpires = new Date(now.getTime() + 5 * 60 * 1000); // 5 min expiry
    await user.save();
    await (0, sendVerificationEmailByGMAIL_1.sendVerificationEmailByGMAIL)(email, verificationCode);
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "New code sent"));
});
