import { getSellerOrderDetails, getSellerOrders, getSellerOrderStats, updateSellerOrderStatusWithTimeline } from "../../controller/seller/order.controller";
import { Router } from "express";



const router = Router();

// GET /api/v1/seller/orders/stats - get order stats for seller
router.get("/stats", getSellerOrderStats);

// GET /api/v1/seller/orders - get all orders for seller
router.get("/", getSellerOrders);

// GET /api/v1/seller/orders/:orderId - get details of a single order
router.get("/:orderId", getSellerOrderDetails);

// PUT /api/v1/seller/orders/:orderId/status - update order status
router.put("/:orderId/status", updateSellerOrderStatusWithTimeline);

export default router;
