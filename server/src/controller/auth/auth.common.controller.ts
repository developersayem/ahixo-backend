import type {  Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middlewares";
import { User } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";
import { cookieOptions } from "../../utils/cookieOptions";
import { generateVerificationCode } from "../../utils/generateVerificationCode";
import { sendVerificationEmailByGMAIL } from "../../email-templates/sendVerificationEmailByGMAIL";
import { generateAccessTokenAndRefreshToken } from "../../helper/generateAccessTokenAndRefreshToken";


// ---------------- Buyer Login Controller ----------------
export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(400, "Email and password required");

  const user = await User.findOne({
  email,
  role: { $in: ["buyer", "seller"] },
});

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
    address:user.address ,
    sellerInfo: user.sellerInfo,
    wishlist: user.wishlist,
    cart: user.cart,
    orders: user.orders
  };

  // Send response with cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, safeUser, "Login successful"));
});



// *---------------- Get Current User ----------------
export const getCurrentUserController = asyncHandler(async (req: Request, res: Response) => {
  // Assuming your authentication middleware sets req.userId
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  res.json(
    new ApiResponse(200, {
      user,
    })
  );
});

// *---------------- Logout ----------------
export const logoutUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const authenticatedReq = req as AuthenticatedRequest;
    await User.findByIdAndUpdate(
      authenticatedReq.user._id,
      { $set: { refreshToken: "" } },
      { new: true }
    );

    res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  }
);

// *---------------- Change Password ----------------
export const changePasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, oldPassword, newPassword } = req.body;

    // Validate input
    if (!email || !oldPassword || !newPassword) {
      throw new ApiError(400, "Email, old password, and new password are required");
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters long");
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    // Verify old password
    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (!isMatch) throw new ApiError(400, "Old password is incorrect");

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
  }
);

// *---------------- Verify Email ----------------
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (user.emailVerificationCode !== code || !user.emailVerificationCodeExpires) {
    throw new ApiError(400, "Invalid or expired code");
  }

  if (user.emailVerificationCodeExpires < new Date()) {
    throw new ApiError(400, "Code expired");
  }

  user.emailVerified = true;
  user.emailVerificationCode = "";
  user.emailVerificationCodeExpires = null;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
});

// *---------------- Resend OTP with per-user cool down----------------
export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  // Prevent spamming: check if previous OTP is still valid
  const now = new Date();
  if (user.emailVerificationCodeExpires && user.emailVerificationCodeExpires > now) {
    const secondsLeft = Math.ceil((user.emailVerificationCodeExpires.getTime() - now.getTime()) / 1000);
    throw new ApiError(429, `Please wait ${secondsLeft} seconds before requesting a new code`);
  }

  // Generate new OTP
  const verificationCode = generateVerificationCode();
  user.emailVerificationCode = verificationCode;
  user.emailVerificationCodeExpires = new Date(now.getTime() + 5 * 60 * 1000); // 5 min expiry
  await user.save();

  await sendVerificationEmailByGMAIL(email, verificationCode);

  return res.status(200).json(new ApiResponse(200, {}, "New code sent"));
});
