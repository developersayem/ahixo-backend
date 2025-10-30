import type { Request, Response } from "express";
import { cookieOptions } from "../../utils/cookieOptions";
import asyncHandler from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { User } from "../../models/user.model";
import { ApiResponse } from "../../utils/ApiResponse";
import { generateAccessTokenAndRefreshToken } from "../../helper/generateAccessTokenAndRefreshToken";


// *---------------- Register Admin ----------------
// GET /api/v1/admin/create-hardcoded
export const createHardcodedAdminController = asyncHandler(async (req: Request, res: Response) => {
  // Hard-coded admin info
  const adminData = {
    fullName: "ahixo",
    email: "juancat1st@gmail.com",
    phone: "1234567890",
    password: "cVo293>IB7GV",
    role: "admin",
    emailVerified: true,
  };

  // Check if admin already exists
  const existingAdmin = await User.findOne({ email: adminData.email });
  if (existingAdmin) {
    return res.status(200).json(new ApiResponse(200, existingAdmin, "Admin already exists"));
  }

  // Create new admin
  const admin = await User.create(adminData);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      "Hard-coded admin account created successfully"
    )
  );
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(400, "Email and password required");

  const user = await User.findOne({ email, role: "admin" });
  if (!user) throw new ApiError(404, "User not found");

  const isValid = await user.isPasswordCorrect(password);
  if (!isValid) throw new ApiError(401, "Invalid credentials");

  if (!user.emailVerified) throw new ApiError(401, "Email not verified");

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id as string);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Prepare user data without sensitive fields
  const safeUser = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Send response with cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, safeUser, "Login successful"));
});