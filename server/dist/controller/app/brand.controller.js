"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBrands = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const product_model_1 = require("../../models/product.model");
// ---------------- Get All Brands with Icon (Free) ----------------
exports.getAllBrands = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        // Step 1: Get unique brands from DB
        const brands = await product_model_1.Product.aggregate([
            {
                $match: { brand: { $exists: true, $ne: null } },
            },
            {
                $group: {
                    _id: "$brand",
                },
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                },
            },
            { $sort: { name: 1 } },
        ]);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, brands, "Brands fetched successfully"));
    }
    catch (error) {
        console.error("Error fetching brands with icons:", error);
        res.status(500).json(new ApiError_1.ApiError(500, "Server Error"));
    }
});
