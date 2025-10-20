"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const overview_controller_1 = require("../../controller/seller/overview.controller");
const router = (0, express_1.Router)();
// GET /api/v1/seller/overview/stats - get order stats for seller
router.get("/stats", overview_controller_1.getSellerDashboardStats);
// GET /api/v1/seller/overview/recent-orders - get recent orders for seller
router.get("/recent-orders", overview_controller_1.getSellerRecentOrders);
// GET /api/v1/seller/overview/top-products - get top products for seller
router.get("/top-products", overview_controller_1.getSellerTopProducts);
exports.default = router;
