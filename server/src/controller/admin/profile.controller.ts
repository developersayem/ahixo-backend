// controller/seller/profile.controller.ts
import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { User } from "../../models/user.model";



// *----------------- Get Seller Profile -----------------
export const getSellerProfileController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const seller = await User.findById(userId).select("-password -refreshToken");
  if (!seller || seller.role !== "admin") throw new ApiError(404, "admin not found");

  return res.status(200).json(new ApiResponse(200, seller, "admin profile fetched successfully"));
});

// *----------------- Update Seller Profile -----------------
export const updateSellerProfileController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const seller = await User.findById(userId);
  if (!seller || seller.role !== "admin") throw new ApiError(404, "admin not found");

  const { fullName, phone, address = {}, shopName, shopAddress, shopDescription } = req.body;

  // Update general seller info
  if (fullName) seller.fullName = fullName;
  if (phone) seller.phone = phone;

  seller.address = {
    street: address.street || seller.address?.street,
    city: address.city || seller.address?.city,
    country: address.country || seller.address?.country,
    postalCode: address.postalCode || seller.address?.postalCode,
  };

  // Update shop-specific info
  if (shopName) seller.sellerInfo!.shopName = shopName;
  if (shopAddress) seller.sellerInfo!.shopAddress = shopAddress;
  if (shopDescription) seller.sellerInfo!.shopDescription = shopDescription;

  await seller.save();

  const updatedSeller = await User.findById(userId).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, updatedSeller, "Profile updated successfully"));
});
