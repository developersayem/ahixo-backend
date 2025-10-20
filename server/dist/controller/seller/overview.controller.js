"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellerTopProducts = exports.getSellerRecentOrders = exports.getSellerDashboardStats = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiError_1 = require("../../utils/ApiError");
const ApiResponse_1 = require("../../utils/ApiResponse");
const user_model_1 = require("../../models/user.model");
const product_model_1 = require("../../models/product.model");
const order_model_1 = require("../../models/order.model");
const mongoose_1 = __importDefault(require("mongoose"));
// -------------------- SELLER DASHBOARD STATS --------------------
exports.getSellerDashboardStats = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    if (user.role !== "seller")
        throw new ApiError_1.ApiError(403, "Only sellers can view dashboard stats");
    // 1. Count total products
    const totalProducts = await product_model_1.Product.countDocuments({ seller: userId });
    // 2. Count total orders
    const totalOrders = await order_model_1.Order.countDocuments({ seller: userId });
    // 3. Calculate revenue (sum of delivered orders)
    const revenueAgg = await order_model_1.Order.aggregate([
        { $match: { seller: user._id, status: "delivered" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);
    const revenue = revenueAgg[0]?.totalRevenue || 0;
    // 4. Growth (orders compared to last month)
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisMonthOrders = await order_model_1.Order.countDocuments({
        seller: userId,
        createdAt: { $gte: startOfThisMonth },
    });
    const lastMonthOrders = await order_model_1.Order.countDocuments({
        seller: userId,
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    let growth = 0;
    if (lastMonthOrders > 0) {
        growth =
            ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;
    }
    return res.json(new ApiResponse_1.ApiResponse(200, {
        totalProducts,
        totalOrders,
        revenue,
        growth: Math.round(growth),
    }));
});
// -------------------- RECENT ORDERS --------------------
exports.getSellerRecentOrders = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    if (user.role !== "seller")
        throw new ApiError_1.ApiError(403, "Only sellers can view recent orders");
    // limit via query ?limit=5 (default = 10)
    const limit = parseInt(req.query.limit) || 10;
    const recentOrders = await order_model_1.Order.aggregate([
        { $match: { seller: user._id } },
        { $sort: { date: -1 } }, // use "date" field from your schema
        { $limit: limit },
        {
            $project: {
                _id: 1,
                orderNumber: 1,
                status: 1,
                total: 1, // already named "total"
                totalItems: { $size: { $ifNull: ["$products", []] } },
                date: 1,
            },
        },
    ]);
    return res.json(new ApiResponse_1.ApiResponse(200, recentOrders, "Recent orders fetched successfully"));
});
// -------------------- TOP PRODUCTS --------------------
exports.getSellerTopProducts = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    if (user.role !== "seller")
        throw new ApiError_1.ApiError(403, "Only sellers can view top products");
    // limit via query ?limit=5 (default = 5)
    const limit = parseInt(req.query.limit) || 5;
    const topProducts = await order_model_1.Order.aggregate([
        {
            $match: {
                seller: new mongoose_1.default.Types.ObjectId(user._id),
                // status: { $ne: "canceled" },
            },
        },
        { $unwind: "$products" },
        {
            $group: {
                _id: "$products.product", // group by productId
                totalSold: { $sum: "$products.quantity" },
            },
        },
        { $sort: { totalSold: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product",
            },
        },
        { $unwind: "$product" },
        {
            $project: {
                _id: 1,
                totalSold: 1,
                price: "$product.price",
                stock: "$product.stock",
                title: "$product.title",
            },
        },
    ]);
    return res.json(new ApiResponse_1.ApiResponse(200, topProducts, "Top products fetched successfully"));
});
