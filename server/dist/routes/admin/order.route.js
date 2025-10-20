"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_controller_1 = require("../../controller/admin/order.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /api/v1/admin/orders/stats - get order stats for admin
router.get("/stats", order_controller_1.getSellerOrderStats);
// GET /api/v1/admin/orders - get all orders for admin
router.get("/", order_controller_1.getSellerOrders);
// GET /api/v1/admin/orders/:orderId - get details of a single order
router.get("/:orderId", order_controller_1.getSellerOrderDetails);
// PUT /api/v1/admin/orders/:orderId/status - update order status
router.put("/:orderId/status", order_controller_1.updateSellerOrderStatusWithTimeline);
exports.default = router;
