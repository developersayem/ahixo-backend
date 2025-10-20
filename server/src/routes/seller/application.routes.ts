// routes/application.routes.ts
import { Router } from "express";
import { applicationDocsUpload } from "../../middlewares/applicationUpload";
import { createApplication, getApplicationStatus, getMyApplication, resubmitApplication } from "../../controller/seller/application.controller";

const router = Router();

/**
 * Seller/Buyer submits application
 * Uses multer upload middleware
 */
router.post(
  "/",
  applicationDocsUpload(),
  createApplication
);

/**
 * Logged-in user fetches their own applications
 */
router.get("/my", getMyApplication);

// route for application status
router.get("/status", getApplicationStatus);

// route for resubmitting application
router.delete("/resubmit", resubmitApplication);



export default router;
