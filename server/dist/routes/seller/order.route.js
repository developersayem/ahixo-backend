"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_controller_1 = require("../../controller/seller/order.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /api/v1/seller/orders/stats - get order stats for seller
router.get("/stats", order_controller_1.getSellerOrderStats);
// GET /api/v1/seller/orders - get all orders for seller
router.get("/", order_controller_1.getSellerOrders);
// GET /api/v1/seller/orders/:orderId - get details of a single order
router.get("/:orderId", order_controller_1.getSellerOrderDetails);
// PUT /api/v1/seller/orders/:orderId/status - update order status
router.put("/:orderId/status", order_controller_1.updateSellerOrderStatusWithTimeline);
exports.default = router;
