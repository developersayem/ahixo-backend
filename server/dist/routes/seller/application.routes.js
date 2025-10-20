"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/application.routes.ts
const express_1 = require("express");
const applicationUpload_1 = require("../../middlewares/applicationUpload");
const application_controller_1 = require("../../controller/seller/application.controller");
const router = (0, express_1.Router)();
/**
 * Seller/Buyer submits application
 * Uses multer upload middleware
 */
router.post("/", (0, applicationUpload_1.applicationDocsUpload)(), application_controller_1.createApplication);
/**
 * Logged-in user fetches their own applications
 */
router.get("/my", application_controller_1.getMyApplication);
// route for application status
router.get("/status", application_controller_1.getApplicationStatus);
// route for resubmitting application
router.delete("/resubmit", application_controller_1.resubmitApplication);
exports.default = router;
