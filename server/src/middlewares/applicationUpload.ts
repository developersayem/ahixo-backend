// middlewares/applicationUpload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Multer storage for seller applications
export const applicationDocsUpload = () => {
  const storage = multer.diskStorage({
    destination: (req: Request & { user?: any }, file, cb) => {
      const applicant = req.user;
      const userId = applicant?._id;
      const userName = (applicant?.fullName || "user")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

      const dir = path.join("public", "applications", `${userId}-${userName}`);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const userId = (req as any).user?._id;
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1e6);

      // Get extension
      const ext = path.extname(file.originalname);
      // Safe filename
      const nameWithoutExt = path.basename(file.originalname, ext);
      const safeName = nameWithoutExt.replace(/\s+/g, "-").toLowerCase();

      // Save with clear prefix (nidFront, nidBack, passport)
      let prefix = "doc";
      if (file.fieldname === "nidFront") prefix = "nid-front";
      if (file.fieldname === "nidBack") prefix = "nid-back";
      if (file.fieldname === "passport") prefix = "passport";

      const finalFilename = `${userId}-${prefix}-${timestamp}-${random}-${safeName}${ext}`;
      cb(null, finalFilename);
    },
  });

  return multer({ storage }).fields([
    { name: "nidFront", maxCount: 1 },
    { name: "nidBack", maxCount: 1 },
    { name: "passport", maxCount: 1 },
  ]);
};

export const toPublicUrl = (filePath: string) => {
  if (!filePath) return "";
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
  const normalizedPath = filePath.replace(/\\/g, "/");
  const publicUrl = `${backendUrl}/${normalizedPath}`;
  console.log(`Generated URL: ${publicUrl}`);
  return publicUrl;
};
