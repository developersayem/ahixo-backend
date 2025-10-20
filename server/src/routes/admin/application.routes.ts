// routes/application.routes.ts
import { getAllApplications, reviewApplication } from "../../controller/admin/application.controller";
import { Router } from "express";


const router = Router();

/**
 * Admin routes
 */

router.get("/", getAllApplications);
router.patch(
  "/:id/review",
  reviewApplication
);

export default router;
