import type{ Request, Response } from "express";
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { User } from "../../models/user.model";


// ---------------- Get All Buyers ----------------
export const getAllBuyers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search } = req.query;

  const filters: any = { role: "buyer" };

  if (search) {
    filters.fullName = { $regex: search as string, $options: "i" };
  }

  const buyers = await User.find(filters)
    .select("-password -refreshToken -emailVerificationCode -emailVerificationCodeExpires") // hide sensitive fields
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, buyers, "Buyers fetched successfully")
  );
});

// ---------------- Get Single Buyer ----------------
export const getSingleBuyer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid buyer ID");
  }

  const buyer = await User.findOne({ _id: id, role: "buyer" })
    .select("-password -refreshToken -emailVerificationCode -emailVerificationCodeExpires");

  if (!buyer) {
    throw new ApiError(404, "Buyer not found");
  }

  res.status(200).json(
    new ApiResponse(200, buyer, "Buyer fetched successfully")
  );
});