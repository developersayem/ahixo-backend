// controllers/application.controller.ts
import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { Application } from "../../models/application.model";
import { User } from "../../models/user.model";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({});



// ---------------- Admin: Get all applications ----------------
export const getAllApplications = asyncHandler(async (req: Request, res: Response) => {
  const applications = await Application.find()
    .populate("user", "fullName email phone address") // populate only needed fields
    .sort({ createdAt: -1 }); // optional: latest first

  res.json(
    new ApiResponse(200, applications, "Applications fetched successfully")
  );
});



// ---------------- Admin: Review (approve/reject) ----------------

export const reviewApplication = asyncHandler(async (req: Request, res: Response) => {
  const { status, adminNotes } = req.body;
  const { id } = req.params;

  // --- 1️⃣ Validate status ---
  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  // --- 2️⃣ Find the application ---
  const application = await Application.findById(id);
  if (!application) throw new ApiError(404, "Application not found");

  // --- 3️⃣ Update application record ---
  application.status = status;
  if (adminNotes) application.adminNotes = adminNotes;
  await application.save();

  // --- 4️⃣ Find user ---
  const user = await User.findById(application.user);
  if (!user) throw new ApiError(404, "User not found");
  if (user.email !== application.email) throw new ApiError(400, "Email mismatch");

  // --- 5️⃣ Base seller info setup ---
  const baseSellerInfo = {
    shopName: user.sellerInfo?.shopName || "",
    shopAddress: user.sellerInfo?.shopAddress || "",
    shopDescription: user.sellerInfo?.shopDescription || "",
    rating: user.sellerInfo?.rating || 0,
    totalSales: user.sellerInfo?.totalSales || 0,
    isVerified: false,
    documents: user.sellerInfo?.documents || [],
  };

  // --- 6️⃣ Handle approval ---
  if (status === "approved") {
    const documents: string[] = [];
    if (application.idType === "national_id") {
      if (application.nidFront) documents.push(application.nidFront);
      if (application.nidBack) documents.push(application.nidBack);
    } else if (application.idType === "passport" && application.passport) {
      documents.push(application.passport);
    }

    // --- Safer mutation (reassign instead of deep mutate) ---
    user.role = "seller";
    user.sellerInfo = {
      ...baseSellerInfo,
      isVerified: true,
      documents: [...new Set([...baseSellerInfo.documents, ...documents])],
    };

    await user.save();

    // --- Send approval email ---
    if (user.email) {
      const transporter = nodemailer.createTransport({
        host: process.env.GMAIL_HOST,
        port: Number(process.env.GMAIL_PORT) || 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Ahixo Marketplace" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: "Your Seller Application has been Approved ✅",
        html: `
          <h2>Hi ${user.fullName || "Seller"},</h2>
          <p>Congratulations! Your seller application for <strong>${application.businessName}</strong> has been approved.</p>
          <p>You can now log in and start selling on Ahixo Marketplace.</p>
        `,
      });
    }
  }

  // --- 7️⃣ Handle rejection ---
  if (status === "rejected") {
    user.sellerInfo = { ...baseSellerInfo, isVerified: false };
    await user.save();

    if (user.email) {
      const transporter = nodemailer.createTransport({
        host: process.env.GMAIL_HOST,
        port: Number(process.env.GMAIL_PORT) || 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Ahixo Marketplace" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: "Your Seller Application has been Rejected ❌",
        html: `
          <h2>Hi ${user.fullName || "Seller"},</h2>
          <p>Unfortunately, your seller application for <strong>${application.businessName}</strong> has been rejected.</p>
          ${
            adminNotes
              ? `<p><strong>Reason:</strong> ${adminNotes}</p>`
              : ""
          }
          <p>You can reapply after resolving any noted issues.</p>
        `,
      });
    }
  }

  return res.json(
    new ApiResponse(200, application, "Application reviewed successfully")
  );
});
