import type{ Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { Product } from "../../models/product.model";

// ---------------- Get All Brands with Icon (Free) ----------------
export const getAllBrands = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Step 1: Get unique brands from DB
    const brands = await Product.aggregate([
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


    res.status(200).json(
        new ApiResponse(200, brands, "Brands fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching brands with icons:", error);
    res.status(500).json(
        new ApiError(500, "Server Error"));
  }
});

