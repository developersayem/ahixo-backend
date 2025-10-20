import { getSellerOrderDetails, getSellerOrders, getSellerOrderStats, updateSellerOrderStatusWithTimeline } from "../../controller/admin/order.controller";
import { Router } from "express";



const router = Router();

// GET /api/v1/admin/orders/stats - get order stats for admin
router.get("/stats", getSellerOrderStats);

// GET /api/v1/admin/orders - get all orders for admin
router.get("/", getSellerOrders);

// GET /api/v1/admin/orders/:orderId - get details of a single order
router.get("/:orderId", getSellerOrderDetails);

// PUT /api/v1/admin/orders/:orderId/status - update order status
router.put("/:orderId/status", updateSellerOrderStatusWithTimeline);

export default router;
