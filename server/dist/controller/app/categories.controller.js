"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopCategories = exports.getAllCategories = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const category_model_1 = require("../../models/category.model");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
exports.getAllCategories = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const categories = await category_model_1.Category.aggregate([
            // Step 1: Match top-level categories
            { $match: { parentCategory: null } },
            // Step 2: Recursive lookup to get all subcategories
            {
                $graphLookup: {
                    from: "categories",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parentCategory",
                    as: "subCategoriesRecursive",
                    depthField: "level",
                },
            },
            // Step 3: Project main fields and nested subcategories
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    createdAt: 1,
                    subCategories: "$subCategoriesRecursive",
                },
            },
        ]);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, categories, "Categories fetched successfully"));
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json(new ApiError_1.ApiError(500, "Server Error"));
    }
});
// GET Top 13 Categories
exports.getTopCategories = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const categories = await category_model_1.Category.find()
            .sort({ createdAt: -1 }) // latest first
            .limit(13)
            .select("_id name"); // select only necessary fields
        res.status(200).json(new ApiResponse_1.ApiResponse(200, categories, "Top categories fetched successfully"));
    }
    catch (error) {
        res.status(500).json(new ApiError_1.ApiError(500, "Server Error"));
    }
});
