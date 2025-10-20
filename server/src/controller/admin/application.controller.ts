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
  const { status, adminNotes } = req.body; // adminNotes optional
  const { id } = req.params;

  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const application = await Application.findById(id);
  if (!application) throw new ApiError(404, "Application not found");

  application.status = status as "approved" | "rejected";
  if (adminNotes) application.adminNotes = adminNotes;
  await application.save();

  const user = await User.findById(application.user);
  if (!user) throw new ApiError(404, "User not found");
  if(!(user.email === application.email)) throw new ApiError(400, "Email mismatch");

  // Ensure sellerInfo exists
  if (!user.sellerInfo) {
    user.sellerInfo = {
      shopName: "",
      shopAddress: "",
      shopDescription: "",
      rating: 0,
      totalSales: 0,
      isVerified: false,
      documents: [],
    };
  }

  if (status === "approved") {
    // Collect documents
    const documents: string[] = [];
    if (application.idType === "national_id") {
      if (application.nidFront) documents.push(application.nidFront);
      if (application.nidBack) documents.push(application.nidBack);
    } else if (application.idType === "passport" && application.passport) {
      documents.push(application.passport);
    }

    // Update user
    user.role = "seller";
    user.sellerInfo.isVerified = true;
    user.sellerInfo?.documents?.push(...documents);
    await user.save();

    // Send approval email
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

      const mailOptions = {
        from: `"Ahixo Marketplace" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: "Your Seller Application has been Approved ✅",
        html: `
          <h2>Hi ${user.fullName || "Seller"},</h2>
          <p>Congratulations! Your seller application for <strong>${application.businessName}</strong> has been approved.</p>
          <p>Please login to your account to start selling on the Ahixo marketplace.</p>
          <p>Thank you for joining us!</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    }
  }

  if (status === "rejected") {
    user.sellerInfo.isVerified = false;
    await user.save();

    // Send rejection email
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

      const mailOptions = {
        from: `"Ahixo Marketplace" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: "Your Seller Application has been Rejected ❌",
        html: `
          <h2>Hi ${user.fullName || "Seller"},</h2>
          <p>We regret to inform you that your seller application for <strong>${application.businessName}</strong> has been rejected.</p>
          ${
            application.adminNotes
              ? `<p>Reason: ${application.adminNotes}</p>`
              : ""
          }
          <p>You can reapply after reviewing the requirements.</p>
          <p>Thank you for your interest in joining Ahixo marketplace.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    }
  }

  res.json(
    new ApiResponse(200, application, "Application reviewed successfully")
  );
});