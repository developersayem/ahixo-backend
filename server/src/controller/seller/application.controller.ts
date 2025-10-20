// controllers/application.controller.ts
import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { Application } from "../../models/application.model";
import { toPublicUrl } from "../../middlewares/applicationUpload";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import fs from "fs";
import path from "path";


// ---------------- Create new application ----------------
export const createApplication = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id; // auth middleware must set req.user
  if (!userId) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));

  const {
    businessName,
    businessType,
    taxId,
    address,
    phone,
    email,
    description,
    idType,
  } = req.body;

  console.log(req.body);

  // Uploaded files from multer
  const files = req.files as {
    nidFront?: Express.Multer.File[];
    nidBack?: Express.Multer.File[];
    passport?: Express.Multer.File[];
  };

  // Convert to public URLs
  const nidFront = files?.nidFront?.[0]?.path ? toPublicUrl(files.nidFront[0].path) : undefined;
  const nidBack = files?.nidBack?.[0]?.path ? toPublicUrl(files.nidBack[0].path) : undefined;
  const passport = files?.passport?.[0]?.path ? toPublicUrl(files.passport[0].path) : undefined;

  // ---------------- Validation ----------------
  if (idType === "national_id" && (!nidFront || !nidBack)) {
    return res.status(400).json(new ApiResponse(400, null, "National ID images are required"));
  }
  if (idType === "passport" && !passport) {
    return res.status(400).json(new ApiResponse(400, null, "Passport image is required"));
  }

  // ---------------- Save Application ----------------
  const application = await Application.create({
  user: userId,
  businessName,
  businessType,
  taxId,
  address,
  phone,
  email,
  description,
  idType,
  nidFront: idType === "national_id" ? nidFront : undefined,
  nidBack: idType === "national_id" ? nidBack : undefined,
  passport: idType === "passport" ? passport : undefined,
});


  return res.status(201).json(
    new ApiResponse(201, application, "Application created successfully")
  );
});

// ---------------- Get logged-in seller's application ----------------
export const getMyApplication = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) return new ApiError(401, "Unauthorized");

  const application = await Application.findOne({ user: userId });
  if (!application) return res.status(404).json(new ApiResponse(404, null, "Application not found"));

  res.json(
    new ApiResponse(200, application, "Application fetched successfully")
  );
});

// ---------------- Get only application status ----------------
export const getApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) {
    return res.status(401).json(
      new ApiError(401, "Unauthorized")
    );
  }

  // Only select the "status" field
  const application = await Application.findOne({ user: userId }).select("status");

  if (!application) {
    return res.status(200).json(
      new ApiResponse(200,
      null
      ,"Application not found")
    );
  }

  return res.json(new ApiResponse(200, application.status, "Application status fetched successfully"));
});


// ---------------- Resubmit (delete rejected application) ----------------

export const resubmitApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    if (!userId) {
      return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    // Find rejected application
    const application = await Application.findOne({
      user: userId,
      status: "rejected",
    });

    if (!application) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No rejected application found"));
    }

    // Delete uploaded files
    const filesToDelete: string[] = [];
    if (application.nidFront) filesToDelete.push(application.nidFront);
    if (application.nidBack) filesToDelete.push(application.nidBack);
    if (application.passport) filesToDelete.push(application.passport);

    filesToDelete.forEach((fileUrl) => {
      try {
        // Convert public URL to local path
        const filePath = fileUrl.replace(
          process.env.BACKEND_URL || "http://localhost:5001",
          "."
        );
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Error deleting file:", fileUrl, err);
      }
    });

    // Optionally, remove the folder if empty
    const dirPath = path.dirname(
      filesToDelete[0]?.replace(process.env.BACKEND_URL || "http://localhost:5001", ".") || ""
    );
    if (dirPath && fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
      fs.rmdirSync(dirPath);
    }

    // Delete application from DB
    await application.deleteOne();

    return res.json(
      new ApiResponse(200, null, "Rejected application deleted. You can now resubmit.")
    );
  }
);