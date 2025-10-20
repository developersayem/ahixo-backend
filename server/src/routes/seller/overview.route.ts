
import { Router } from "express";
import { getSellerDashboardStats, getSellerRecentOrders, getSellerTopProducts } from "../../controller/seller/overview.controller";



const router = Router();

// GET /api/v1/seller/overview/stats - get order stats for seller
router.get("/stats", getSellerDashboardStats);
// GET /api/v1/seller/overview/recent-orders - get recent orders for seller
router.get("/recent-orders", getSellerRecentOrders);
// GET /api/v1/seller/overview/top-products - get top products for seller
router.get("/top-products", getSellerTopProducts);

export default router;
