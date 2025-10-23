import type { Request, Response } from "express";
import { cookieOptions } from "../../utils/cookieOptions";
import asyncHandler from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { User } from "../../models/user.model";
import { ApiResponse } from "../../utils/ApiResponse";
import { generateAccessTokenAndRefreshToken } from "../../helper/generateAccessTokenAndRefreshToken";


// *---------------- Register Admin ----------------
export const adminRegistrationController = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, phone, shopName, shopAddress } = req.body;

  console.log({ fullName, email, password, phone, shopName, shopAddress })

  if ([fullName, email, password, phone].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email address");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }


  // Create admin
  const admin = await User.create({
    fullName,
    email,
    password,
    phone,
    role: "admin",
    emailVerified: true,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      { email: admin.email },
      "Account created successfully"
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