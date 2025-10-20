"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.editCategory = exports.getParentCategories = exports.getAllCategories = exports.createCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ApiError_1 = require("../../utils/ApiError");
const ApiResponse_1 = require("../../utils/ApiResponse");
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const category_model_1 = require("../../models/category.model");
// =============================
// 1. Create Category
// =============================
exports.createCategory = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const { name, description, parent } = req.body;
        if (!name) {
            throw new ApiError_1.ApiError(400, "Category name is required");
        }
        // Create new category
        const newCategory = await category_model_1.Category.create({
            name: name.toLowerCase(),
            description,
            parentCategory: parent || null,
            subCategories: [],
        });
        // If has parent → update parent with this subcategory
        if (parent) {
            await category_model_1.Category.findByIdAndUpdate(parent, {
                $addToSet: { subCategories: newCategory._id }, // prevents duplicates
            });
        }
        res
            .status(201)
            .json(new ApiResponse_1.ApiResponse(201, newCategory, "Category created successfully"));
    }
    catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json(new ApiError_1.ApiError(500, "Server Error"));
    }
});
// =============================
// 2. Get All Categories (with parent + subcategories populated)
// =============================
exports.getAllCategories = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const categories = await category_model_1.Category.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "parentCategory",
                    foreignField: "_id",
                    as: "parentCategory",
                },
            },
            { $unwind: { path: "$parentCategory", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "categories",
                    localField: "subCategories",
                    foreignField: "_id",
                    as: "subCategories",
                },
            },
            { $sort: { createdAt: -1 } },
        ]);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, categories, "Categories fetched successfully"));
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json(new ApiError_1.ApiError(500, "Server Error"));
    }
});
// =============================
// 3. Get All Parent Categories (those with no parentCategory)
// =============================
exports.getParentCategories = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const parents = await category_model_1.Category.aggregate([
            { $match: { parentCategory: null } },
            {
                $lookup: {
                    from: "categories",
                    localField: "subCategories",
                    foreignField: "_id",
                    as: "subCategories",
                },
            },
            { $sort: { createdAt: -1 } },
        ]);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, parents, "Parent categories fetched successfully"));
    }
    catch (error) {
        console.error("Error fetching parent categories:", error);
        res.status(500).json(new ApiError_1.ApiError(500, "Server Error"));
    }
});
// =============================
// 4. Edit Category
// =============================
exports.editCategory = (0, asyncHandler_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parent } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new ApiError_1.ApiError(400, "Invalid category ID");
        }
        const category = await category_model_1.Category.findById(id);
        if (!category) {
            return res.status(404).json(new ApiResponse_1.ApiResponse(404, null, "Category not found"));
        }
        const oldParent = category.parentCategory?.toString();
        const newParent = parent || null;
        category.name = name || category.name;
        category.description = description || category.description;
        category.parentCategory = newParent;
        await category.save();
        // Handle parent re-assignment
        if (oldParent && oldParent !== newParent) {
            await category_model_1.Category.findByIdAndUpdate(oldParent, {
                $pull: { subCategories: category._id },
            });
        }
        if (newParent && oldParent !== newParent) {
            await category_model_1.Category.findByIdAndUpdate(newParent, {
                $addToSet: { subCategories: category._id },
            });
        }
        res
            .status(200)
            .json(new ApiResponse_1.ApiResponse(200, category, "Category updated successfully"));
    }
    catch (error) {
        console.error("Error editing category:", error);
        res.status(500).json(new ApiError_1.ApiError(500, "Server Error"));
    }
});
// =============================
// 5. Delete Category
// =============================
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            throw new ApiError_1.ApiError(400, "Category ID is required");
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            throw new ApiError_1.ApiError(400, "Invalid category ID");
        // Remove category
        const deleted = await category_model_1.Category.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json(new ApiResponse_1.ApiResponse(404, null, "Category not found"));
        }
        // Clean up references from parent
        if (deleted.parentCategory) {
            await category_model_1.Category.updateOne({ _id: deleted.parentCategory }, { $pull: { subCategories: deleted._id } });
        }
        // Optionally delete children (cascade delete) ⚠️
        await category_model_1.Category.deleteMany({ parentCategory: deleted._id });
        res.status(200).json(new ApiResponse_1.ApiResponse(200, deleted, "Category deleted successfully"));
    }
    catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json(new ApiError_1.ApiError(500, "Server Error"));
    }
};
exports.deleteCategory = deleteCategory;
