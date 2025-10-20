// controllers/sellerDashboard.controller.ts
import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { User } from "../../models/user.model";
import { Product } from "../../models/product.model";
import { Order } from "../../models/order.model";
import mongoose from "mongoose";

// -------------------- SELLER DASHBOARD STATS --------------------
export const getSellerDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (user.role !== "admin")
      throw new ApiError(403, "Only admins can view dashboard stats");

    // 1. Count total products
    const totalProducts = await Product.countDocuments({ seller: userId });

    // 2. Count total orders
    const totalOrders = await Order.countDocuments({ seller: userId });

    // 3. Calculate revenue (sum of delivered orders)
    const revenueAgg = await Order.aggregate([
      { $match: { seller: user._id, status: "delivered" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);
    const revenue = revenueAgg[0]?.totalRevenue || 0;

    // 4. Growth (orders compared to last month)
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthOrders = await Order.countDocuments({
      seller: userId,
      createdAt: { $gte: startOfThisMonth },
    });

    const lastMonthOrders = await Order.countDocuments({
      seller: userId,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    let growth = 0;
    if (lastMonthOrders > 0) {
      growth =
        ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;
    }

    return res.json(
      new ApiResponse(200, {
        totalProducts,
        totalOrders,
        revenue,
        growth: Math.round(growth),
      })
    );
  }
);

// -------------------- RECENT ORDERS --------------------
export const getSellerRecentOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    if (user.role !== "admin")
      throw new ApiError(403, "Only admins can view recent orders");

    // limit via query ?limit=5 (default = 10)
    const limit = parseInt(req.query.limit as string) || 10;

    const recentOrders = await Order.aggregate([
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

    return res.json(
      new ApiResponse(
        200,
      recentOrders,
        "Recent orders fetched successfully"
      )
    );
  }
);

// -------------------- TOP PRODUCTS --------------------
export const getSellerTopProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    if (user.role !== "admin")
      throw new ApiError(403, "Only admins can view top products");

    // limit via query ?limit=5 (default = 5)
    const limit = parseInt(req.query.limit as string) || 5;

    const topProducts = await Order.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(user._id as string),
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

    return res.json(
      new ApiResponse(200, topProducts, "Top products fetched successfully")
    );
  }
);

