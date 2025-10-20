import type{ Request, Response } from "express";
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { User } from "../../models/user.model";



// ---------------- Get All Sellers ----------------
export const getAllSellers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search } = req.query;

  const filters: any = { role: "seller" };

  if (search) {
    filters.shopName = { $regex: search as string, $options: "i" };
  }

  const sellers = await User.find(filters)
    .select("-password -refreshToken -emailVerificationCode -emailVerificationCodeExpires") // hide sensitive fields
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, sellers , "Sellers fetched successfully")
  );
});

// ---------------- Get Single Seller ----------------
export const getSingleSeller = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid seller ID");
  }

  const seller = await User.findOne({ _id: id, role: "seller" })
    .select("-password -refreshToken -emailVerificationCode -emailVerificationCodeExpires");

  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  res.status(200).json(
    new ApiResponse(200, seller, "Seller fetched successfully")
  );
});
