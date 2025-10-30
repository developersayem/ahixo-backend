"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = exports.createHardcodedAdminController = void 0;
const cookieOptions_1 = require("../../utils/cookieOptions");
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiError_1 = require("../../utils/ApiError");
const user_model_1 = require("../../models/user.model");
const ApiResponse_1 = require("../../utils/ApiResponse");
const generateAccessTokenAndRefreshToken_1 = require("../../helper/generateAccessTokenAndRefreshToken");
// *---------------- Register Admin ----------------
// GET /api/v1/admin/create-hardcoded
exports.createHardcodedAdminController = (0, asyncHandler_1.default)(async (req, res) => {
    // Hard-coded admin info
    const adminData = {
        fullName: "ahixo",
        email: "juancat1st@gmail.com",
        phone: "1234567890",
        password: "cVo293>IB7GV",
        role: "admin",
        emailVerified: true,
    };
    // Check if admin already exists
    const existingAdmin = await user_model_1.User.findOne({ email: adminData.email });
    if (existingAdmin) {
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, existingAdmin, "Admin already exists"));
    }
    // Create new admin
    const admin = await user_model_1.User.create(adminData);
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
    }, "Hard-coded admin account created successfully"));
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
