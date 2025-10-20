import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { User } from "../../models/user.model";
import { generateVerificationCode } from "../../utils/generateVerificationCode";
import { sendVerificationEmailByGMAIL } from "../../email-templates/sendVerificationEmailByGMAIL";
import { generateAccessTokenAndRefreshToken } from "../../helper/generateAccessTokenAndRefreshToken";
import { cookieOptions } from "../../utils/cookieOptions";

// *---------------- Register Buyer ----------------
export const buyerRegistrationController = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, phone } = req.body;

  if ([fullName, email, phone, password].some((f) => !f?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(400, "User already exists");

  const verificationCode = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const user = await User.create({
    fullName,
    email,
    phone,
    password,
    role: "buyer",
    emailVerified: false,
    emailVerificationCode: verificationCode,
    emailVerificationCodeExpires: expiresAt,
  });

  await sendVerificationEmailByGMAIL(email, verificationCode);

  return res.status(201).json(
    new ApiResponse(201, { email: user.email }, "Verification code sent")
  );
});


