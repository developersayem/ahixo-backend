"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/application.routes.ts
const application_controller_1 = require("../../controller/admin/application.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * Admin routes
 */
router.get("/", application_controller_1.getAllApplications);
router.patch("/:id/review", application_controller_1.reviewApplication);
exports.default = router;
