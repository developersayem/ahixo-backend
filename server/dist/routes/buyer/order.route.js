"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_controller_1 = require("../../controller/buyer/order.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /api/v1/Buyer/orders/stats - get order stats
router.get("/stats", order_controller_1.getBuyerOrderStats);
// GET /api/v1/Buyer/orders - get all orders
router.get("/", order_controller_1.getBuyerOrders);
// Create a new order - POST /api/v1/Buyer/orders
router.post("/", order_controller_1.createOrder);
// GET /api/v1/Buyer/orders/:orderId - get details of a single order
router.get("/:orderId", order_controller_1.getBuyerOrderDetails);
// PUT /api/v1/Buyer/orders/:orderId/status - update order status
router.put("/:orderId/status", order_controller_1.updateBuyerOrderStatusWithTimeline);
// PUT /api/v1/Buyer/orders/:orderId/cancel - cancel order
router.put("/:orderId/cancel", order_controller_1.cancelOrder);
// DELETE /api/v1/buyer/orders/:orderId/product/:productId
router.delete("/:orderId/product/:productId", order_controller_1.removeOrderItem);
exports.default = router;
