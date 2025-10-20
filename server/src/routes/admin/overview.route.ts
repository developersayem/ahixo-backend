
import { Router } from "express";
import { getSellerDashboardStats, getSellerRecentOrders, getSellerTopProducts } from "../../controller/admin/overview.controller";



const router = Router();

// GET /api/v1/admin/overview/stats - get order stats for admin
router.get("/stats", getSellerDashboardStats);
// GET /api/v1/admin/overview/recent-orders - get recent orders for admin
router.get("/recent-orders", getSellerRecentOrders);
// GET /api/v1/admin/overview/top-products - get top products for admin
router.get("/top-products", getSellerTopProducts);

export default router;
