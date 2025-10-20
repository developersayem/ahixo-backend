// middlewares/productUpload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

export const productImagesUpload = (folderName: string) => {
  const storage = multer.diskStorage({
    destination: (req: Request & { user?: any }, file, cb) => {
      const vendor = req.user;
      const vendorId = vendor?._id;
      const vendorName = (vendor?.fullName || "vendor")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

      const dir = path.join("public", `${vendorId}-${vendorName}`, folderName);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const vendorId = (req as any).user?._id;
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1e6);
      
      // Get file extension
      const ext = path.extname(file.originalname);
      
      // Get filename without extension and make it safe
      const nameWithoutExt = path.basename(file.originalname, ext);
      const safeName = nameWithoutExt.replace(/\s+/g, "-");
      
      // Combine everything with the extension
      const finalFilename = `${vendorId}-${timestamp}-${random}-${safeName}${ext}`;
      
      cb(null, finalFilename);
    },
  });

  return multer({ storage }).array("images", 10);
};

export const toPublicUrl = (filePath: string) => {
  if (!filePath) return "";
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
  const normalizedPath = filePath.replace(/\\/g, "/");
  const publicUrl = `${backendUrl}/${normalizedPath}`;
  console.log(`Generated URL: ${publicUrl}`);
  return publicUrl;
};