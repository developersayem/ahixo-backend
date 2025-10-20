// controller/auth/refresh.controller.ts
import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { User } from "../../models/user.model";
import { generateAccessTokenAndRefreshToken } from "../../helper/generateAccessTokenAndRefreshToken";
import { cookieOptions } from "../../utils/cookieOptions";



//* ===============  Refresh Access Token ===============
export const refreshAccessTokenController = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) throw new ApiError(401, "No refresh token provided");

  const user = await User.findOne({ refreshToken });
  if (!user) throw new ApiError(401, "Invalid refresh token");

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessTokenAndRefreshToken(user._id as string);

  user.refreshToken = newRefreshToken;
  await user.save();

  res
  .cookie("accessToken", accessToken, cookieOptions)
  .cookie("refreshToken", newRefreshToken, cookieOptions);

  return res.status(200).json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});