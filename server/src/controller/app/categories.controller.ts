import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { Category } from "../../models/category.model";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  try {
    const categories = await Category.aggregate([
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

    res.status(200).json(
      new ApiResponse(200, categories, "Categories fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json(new ApiError(500, "Server Error"));
  }
});


// GET Top 13 Categories
export const getTopCategories = asyncHandler(async (req: Request, res: Response) => {
  try {
    const categories = await Category.find()
      .sort({ createdAt: -1 }) // latest first
      .limit(13)
      .select("_id name"); // select only necessary fields

    res.status(200).json(
      new ApiResponse(200, categories, "Top categories fetched successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Server Error"));
  }
});