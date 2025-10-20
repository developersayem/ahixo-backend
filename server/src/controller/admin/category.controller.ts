import type{ Request, Response } from "express";
import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";
import {Category} from "../../models/category.model";



// =============================
// 1. Create Category
// =============================
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, description, parent } = req.body;

    if (!name) {
      throw new ApiError(400, "Category name is required");
    }

    // Create new category
    const newCategory = await Category.create({
      name:name.toLowerCase(),
      description,
      parentCategory: parent || null,
      subCategories: [],
    });

    // If has parent → update parent with this subcategory
    if (parent) {
      await Category.findByIdAndUpdate(parent, {
        $addToSet: { subCategories: newCategory._id }, // prevents duplicates
      });
    }

    res
      .status(201)
      .json(new ApiResponse(201, newCategory, "Category created successfully"));
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json(new ApiError(500, "Server Error"));
  }
});

// =============================
// 2. Get All Categories (with parent + subcategories populated)
// =============================
export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  try {
    const categories = await Category.aggregate([
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

    res.status(200).json(
        new ApiResponse(200, categories, "Categories fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json(
        new ApiError(500, "Server Error")
    );
  }
});

// =============================
// 3. Get All Parent Categories (those with no parentCategory)
// =============================
export const getParentCategories = asyncHandler( async (req: Request, res: Response) => {
  try {
    const parents = await Category.aggregate([
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

    res.status(200).json(
        new ApiResponse(200, parents, "Parent categories fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching parent categories:", error);
    res.status(500).json(
        new ApiError(500, "Server Error")
    );
  }
});

// =============================
// 4. Edit Category
// =============================
export const editCategory = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, parent } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid category ID");
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json(new ApiResponse(404, null, "Category not found"));
    }

    const oldParent = category.parentCategory?.toString();
    const newParent = parent || null;

    category.name = name || category.name;
    category.description = description || category.description;
    category.parentCategory = newParent;

    await category.save();

    // Handle parent re-assignment
    if (oldParent && oldParent !== newParent) {
      await Category.findByIdAndUpdate(oldParent, {
        $pull: { subCategories: category._id },
      });
    }
    if (newParent && oldParent !== newParent) {
      await Category.findByIdAndUpdate(newParent, {
        $addToSet: { subCategories: category._id },
      });
    }

    res
      .status(200)
      .json(new ApiResponse(200, category, "Category updated successfully"));
  } catch (error) {
    console.error("Error editing category:", error);
    res.status(500).json(new ApiError(500, "Server Error"));
  }
});

// =============================
// 5. Delete Category
// =============================
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if(!id) throw new ApiError(400, "Category ID is required");
    if(!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid category ID");

    // Remove category
    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) {
    return res.status(404).json( new ApiResponse(404,null, "Category not found"));
    }

    // Clean up references from parent
    if (deleted.parentCategory) {
      await Category.updateOne(
        { _id: deleted.parentCategory },
        { $pull: { subCategories: deleted._id } }
      );
    }

    // Optionally delete children (cascade delete) ⚠️
    await Category.deleteMany({ parentCategory: deleted._id });

    res.status(200).json(
        new ApiResponse(200, deleted, "Category deleted successfully")
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json(
        new ApiError(500, "Server Error")
    );
  }
};
