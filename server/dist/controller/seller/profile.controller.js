"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSellerProfileController = exports.getSellerProfileController = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiError_1 = require("../../utils/ApiError");
const ApiResponse_1 = require("../../utils/ApiResponse");
const user_model_1 = require("../../models/user.model");
// *----------------- Get Seller Profile -----------------
exports.getSellerProfileController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const seller = await user_model_1.User.findById(userId).select("-password -refreshToken");
    if (!seller || seller.role !== "seller")
        throw new ApiError_1.ApiError(404, "Seller not found");
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, seller, "Seller profile fetched successfully"));
});
// *----------------- Update Seller Profile -----------------
exports.updateSellerProfileController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const seller = await user_model_1.User.findById(userId);
    if (!seller || seller.role !== "seller")
        throw new ApiError_1.ApiError(404, "Seller not found");
    const { fullName, phone, address = {}, shopName, shopAddress, shopDescription } = req.body;
    // Update general seller info
    if (fullName)
        seller.fullName = fullName;
    if (phone)
        seller.phone = phone;
    seller.address = {
        street: address.street || seller.address?.street,
        city: address.city || seller.address?.city,
        country: address.country || seller.address?.country,
        postalCode: address.postalCode || seller.address?.postalCode,
    };
    // Update shop-specific info
    if (shopName)
        seller.sellerInfo.shopName = shopName;
    if (shopAddress)
        seller.sellerInfo.shopAddress = shopAddress;
    if (shopDescription)
        seller.sellerInfo.shopDescription = shopDescription;
    await seller.save();
    const updatedSeller = await user_model_1.User.findById(userId).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, updatedSeller, "Profile updated successfully"));
});
