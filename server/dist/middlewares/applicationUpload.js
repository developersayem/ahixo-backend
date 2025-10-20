"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUrl = exports.applicationDocsUpload = void 0;
// middlewares/applicationUpload.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ensureDir = (dir) => {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
};
// Multer storage for seller applications
const applicationDocsUpload = () => {
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const applicant = req.user;
            const userId = applicant?._id;
            const userName = (applicant?.fullName || "user")
                .trim()
                .replace(/\s+/g, "-")
                .toLowerCase();
            const dir = path_1.default.join("public", "applications", `${userId}-${userName}`);
            ensureDir(dir);
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const userId = req.user?._id;
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1e6);
            // Get extension
            const ext = path_1.default.extname(file.originalname);
            // Safe filename
            const nameWithoutExt = path_1.default.basename(file.originalname, ext);
            const safeName = nameWithoutExt.replace(/\s+/g, "-").toLowerCase();
            // Save with clear prefix (nidFront, nidBack, passport)
            let prefix = "doc";
            if (file.fieldname === "nidFront")
                prefix = "nid-front";
            if (file.fieldname === "nidBack")
                prefix = "nid-back";
            if (file.fieldname === "passport")
                prefix = "passport";
            const finalFilename = `${userId}-${prefix}-${timestamp}-${random}-${safeName}${ext}`;
            cb(null, finalFilename);
        },
    });
    return (0, multer_1.default)({ storage }).fields([
        { name: "nidFront", maxCount: 1 },
        { name: "nidBack", maxCount: 1 },
        { name: "passport", maxCount: 1 },
    ]);
};
exports.applicationDocsUpload = applicationDocsUpload;
const toPublicUrl = (filePath) => {
    if (!filePath)
        return "";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    const normalizedPath = filePath.replace(/\\/g, "/");
    const publicUrl = `${backendUrl}/${normalizedPath}`;
    console.log(`Generated URL: ${publicUrl}`);
    return publicUrl;
};
exports.toPublicUrl = toPublicUrl;
