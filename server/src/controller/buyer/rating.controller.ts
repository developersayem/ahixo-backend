
import { Product } from "../../models/product.model";
import { ApiError } from "../../utils/ApiError";
import asyncHandler from "../../utils/asyncHandler";
import { Request, Response } from "express";

// Toggle rating
export const toggleRating = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { productId } = req.params;
  const { rating } = req.body;

  if (rating !== undefined && (rating < 0 || rating > 5)) {
    throw new ApiError(400, "Rating must be between 0 and 5");
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // Check if user already rated
  const existingRatingIndex = product.ratings?.findIndex(
    (r) => r.user.toString() === userId
  );

  if (existingRatingIndex !== undefined && existingRatingIndex >= 0) {
    // Remove existing rating (toggle off)
    product.ratings!.splice(existingRatingIndex, 1);
  } else {
    // Add new rating if provided
    if (rating === undefined) {
      throw new ApiError(400, "Rating value is required to add rating");
    }
    product.ratings?.push({ user: userId, rating });
  }

  // Recalculate average rating
  if (product.ratings!.length > 0) {
    const total = product.ratings!.reduce((acc, r) => acc + r.rating, 0);
    product.rating = total / product.ratings!.length;
  } else {
    product.rating = 0; // No ratings
  }

  await product.save();

  res.status(200).json({ success: true, rating: product.rating });
});
