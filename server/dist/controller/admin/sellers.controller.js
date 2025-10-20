"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleSeller = exports.getAllSellers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const user_model_1 = require("../../models/user.model");
// ---------------- Get All Sellers ----------------
exports.getAllSellers = (0, asyncHandler_1.default)(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const filters = { role: "seller" };
    if (search) {
        filters.shopName = { $regex: search, $options: "i" };
    }
    const sellers = await user_model_1.User.find(filters)
        .select("-password -refreshToken -emailVerificationCode -emailVerificationCodeExpires") // hide sensitive fields
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, sellers, "Sellers fetched successfully"));
});
// ---------------- Get Single Seller ----------------
exports.getSingleSeller = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.ApiError(400, "Invalid seller ID");
    }
    const seller = await user_model_1.User.findOne({ _id: id, role: "seller" })
        .select("-password -refreshToken -emailVerificationCode -emailVerificationCodeExpires");
    if (!seller) {
        throw new ApiError_1.ApiError(404, "Seller not found");
    }
    res.status(200).json(new ApiResponse_1.ApiResponse(200, seller, "Seller fetched successfully"));
});
