import { cancelOrder, createOrder, getBuyerOrderDetails, getBuyerOrders, getBuyerOrderStats, removeOrderItem, updateBuyerOrderStatusWithTimeline } from "../../controller/buyer/order.controller";
import { Router } from "express";



const router = Router();

// GET /api/v1/Buyer/orders/stats - get order stats
router.get("/stats", getBuyerOrderStats);

// GET /api/v1/Buyer/orders - get all orders
router.get("/", getBuyerOrders);

// Create a new order - POST /api/v1/Buyer/orders
router.post("/", createOrder);

// GET /api/v1/Buyer/orders/:orderId - get details of a single order
router.get("/:orderId", getBuyerOrderDetails);

// PUT /api/v1/Buyer/orders/:orderId/status - update order status
router.put("/:orderId/status", updateBuyerOrderStatusWithTimeline);

// PUT /api/v1/Buyer/orders/:orderId/cancel - cancel order
router.put("/:orderId/cancel", cancelOrder);

// DELETE /api/v1/buyer/orders/:orderId/product/:productId
router.delete("/:orderId/product/:productId", removeOrderItem);

export default router;
