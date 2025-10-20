"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerRegistrationController = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiError_1 = require("../../utils/ApiError");
const ApiResponse_1 = require("../../utils/ApiResponse");
const user_model_1 = require("../../models/user.model");
const generateVerificationCode_1 = require("../../utils/generateVerificationCode");
const sendVerificationEmailByGMAIL_1 = require("../../email-templates/sendVerificationEmailByGMAIL");
// *---------------- Register Buyer ----------------
exports.buyerRegistrationController = (0, asyncHandler_1.default)(async (req, res) => {
    const { fullName, email, password, phone } = req.body;
    if ([fullName, email, phone, password].some((f) => !f?.trim())) {
        throw new ApiError_1.ApiError(400, "All fields are required");
    }
    const existingUser = await user_model_1.User.findOne({ email });
    if (existingUser)
        throw new ApiError_1.ApiError(400, "User already exists");
    const verificationCode = (0, generateVerificationCode_1.generateVerificationCode)();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const user = await user_model_1.User.create({
        fullName,
        email,
        phone,
        password,
        role: "buyer",
        emailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpires: expiresAt,
    });
    await (0, sendVerificationEmailByGMAIL_1.sendVerificationEmailByGMAIL)(email, verificationCode);
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, { email: user.email }, "Verification code sent"));
});
