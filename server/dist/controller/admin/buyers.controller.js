"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleBuyer = exports.getAllBuyers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const user_model_1 = require("../../models/user.model");
// ---------------- Get All Buyers ----------------
exports.getAllBuyers = (0, asyncHandler_1.default)(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const filters = { role: "buyer" };
    if (search) {
        filters.fullName = { $regex: search, $options: "i" };
    }
    const buyers = await user_model_1.User.find(filters)
        .select("-password -refreshToken -emailVerificationCode -emailVerificationCodeExpires") // hide sensitive fields
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, buyers, "Buyers fetched successfully"));
});
// ---------------- Get Single Buyer ----------------
exports.getSingleBuyer = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.ApiError(400, "Invalid buyer ID");
    }
    const buyer = await user_model_1.User.findOne({ _id: id, role: "buyer" })
        .select("-password -refreshToken -emailVerificationCode -emailVerificationCodeExpires");
    if (!buyer) {
        throw new ApiError_1.ApiError(404, "Buyer not found");
    }
    res.status(200).json(new ApiResponse_1.ApiResponse(200, buyer, "Buyer fetched successfully"));
});
