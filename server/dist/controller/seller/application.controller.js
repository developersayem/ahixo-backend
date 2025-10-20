"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resubmitApplication = exports.getApplicationStatus = exports.getMyApplication = exports.createApplication = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const application_model_1 = require("../../models/application.model");
const applicationUpload_1 = require("../../middlewares/applicationUpload");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// ---------------- Create new application ----------------
exports.createApplication = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id; // auth middleware must set req.user
    if (!userId)
        return res.status(401).json(new ApiResponse_1.ApiResponse(401, null, "Unauthorized"));
    const { businessName, businessType, taxId, address, phone, email, description, idType, } = req.body;
    console.log(req.body);
    // Uploaded files from multer
    const files = req.files;
    // Convert to public URLs
    const nidFront = files?.nidFront?.[0]?.path ? (0, applicationUpload_1.toPublicUrl)(files.nidFront[0].path) : undefined;
    const nidBack = files?.nidBack?.[0]?.path ? (0, applicationUpload_1.toPublicUrl)(files.nidBack[0].path) : undefined;
    const passport = files?.passport?.[0]?.path ? (0, applicationUpload_1.toPublicUrl)(files.passport[0].path) : undefined;
    // ---------------- Validation ----------------
    if (idType === "national_id" && (!nidFront || !nidBack)) {
        return res.status(400).json(new ApiResponse_1.ApiResponse(400, null, "National ID images are required"));
    }
    if (idType === "passport" && !passport) {
        return res.status(400).json(new ApiResponse_1.ApiResponse(400, null, "Passport image is required"));
    }
    // ---------------- Save Application ----------------
    const application = await application_model_1.Application.create({
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
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, application, "Application created successfully"));
});
// ---------------- Get logged-in seller's application ----------------
exports.getMyApplication = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        return new ApiError_1.ApiError(401, "Unauthorized");
    const application = await application_model_1.Application.findOne({ user: userId });
    if (!application)
        return res.status(404).json(new ApiResponse_1.ApiResponse(404, null, "Application not found"));
    res.json(new ApiResponse_1.ApiResponse(200, application, "Application fetched successfully"));
});
// ---------------- Get only application status ----------------
exports.getApplicationStatus = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json(new ApiError_1.ApiError(401, "Unauthorized"));
    }
    // Only select the "status" field
    const application = await application_model_1.Application.findOne({ user: userId }).select("status");
    if (!application) {
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Application not found"));
    }
    return res.json(new ApiResponse_1.ApiResponse(200, application.status, "Application status fetched successfully"));
});
// ---------------- Resubmit (delete rejected application) ----------------
exports.resubmitApplication = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json(new ApiResponse_1.ApiResponse(401, null, "Unauthorized"));
    }
    // Find rejected application
    const application = await application_model_1.Application.findOne({
        user: userId,
        status: "rejected",
    });
    if (!application) {
        return res
            .status(404)
            .json(new ApiResponse_1.ApiResponse(404, null, "No rejected application found"));
    }
    // Delete uploaded files
    const filesToDelete = [];
    if (application.nidFront)
        filesToDelete.push(application.nidFront);
    if (application.nidBack)
        filesToDelete.push(application.nidBack);
    if (application.passport)
        filesToDelete.push(application.passport);
    filesToDelete.forEach((fileUrl) => {
        try {
            // Convert public URL to local path
            const filePath = fileUrl.replace(process.env.BACKEND_URL || "http://localhost:5001", ".");
            if (fs_1.default.existsSync(filePath))
                fs_1.default.unlinkSync(filePath);
        }
        catch (err) {
            console.error("Error deleting file:", fileUrl, err);
        }
    });
    // Optionally, remove the folder if empty
    const dirPath = path_1.default.dirname(filesToDelete[0]?.replace(process.env.BACKEND_URL || "http://localhost:5001", ".") || "");
    if (dirPath && fs_1.default.existsSync(dirPath) && fs_1.default.readdirSync(dirPath).length === 0) {
        fs_1.default.rmdirSync(dirPath);
    }
    // Delete application from DB
    await application.deleteOne();
    return res.json(new ApiResponse_1.ApiResponse(200, null, "Rejected application deleted. You can now resubmit."));
});
