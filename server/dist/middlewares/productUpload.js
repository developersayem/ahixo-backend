"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUrl = exports.productImagesUpload = void 0;
// middlewares/productUpload.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ensureDir = (dir) => {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
};
const productImagesUpload = (folderName) => {
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const vendor = req.user;
            const vendorId = vendor?._id;
            const vendorName = (vendor?.fullName || "vendor")
                .trim()
                .replace(/\s+/g, "-")
                .toLowerCase();
            const dir = path_1.default.join("public", `${vendorId}-${vendorName}`, folderName);
            ensureDir(dir);
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const vendorId = req.user?._id;
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1e6);
            // Get file extension
            const ext = path_1.default.extname(file.originalname);
            // Get filename without extension and make it safe
            const nameWithoutExt = path_1.default.basename(file.originalname, ext);
            const safeName = nameWithoutExt.replace(/\s+/g, "-");
            // Combine everything with the extension
            const finalFilename = `${vendorId}-${timestamp}-${random}-${safeName}${ext}`;
            cb(null, finalFilename);
        },
    });
    return (0, multer_1.default)({ storage }).array("images", 10);
};
exports.productImagesUpload = productImagesUpload;
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
