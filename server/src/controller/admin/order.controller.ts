import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { Order } from "../../models/order.model";
import { ApiError } from "../../utils/ApiError";
import mongoose from "mongoose";
import { ApiResponse } from "../../utils/ApiResponse";

// ---------------- Get Seller Order Stats ----------------
export const getSellerOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user?._id;
  if (!sellerId) throw new ApiError(401, "Unauthorized");

  const sellerObjectId =
    typeof sellerId === "string" ? new mongoose.Types.ObjectId(sellerId) : sellerId;

  // Aggregate counts
  const stats = await Order.aggregate([
    { $match: { seller: sellerObjectId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Map stats into a more readable format
  const totalOrders = stats.reduce((acc, curr) => acc + curr.count, 0);
  const statusMap: Record<string, number> = {};
  stats.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  const result = {
    totalOrders,
    processing: statusMap["processing"] || 0,
    completed: statusMap["completed"] || 0,
    onHold: statusMap["on-hold"] || 0,
    canceled: statusMap["canceled"] || 0,
  };

  res.json(new ApiResponse(200, result, "Seller order stats fetched successfully"));
});

// ---------------- Get all orders for a seller ----------------
export const getSellerOrders = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user?._id;
  if (!sellerId) throw new ApiError(401, "Unauthorized");

  const sellerObjectId =
    typeof sellerId === "string" ? new mongoose.Types.ObjectId(sellerId) : sellerId;

  const orders = await Order.aggregate([
    { $match: { seller: sellerObjectId } },
    { $sort: { date: -1 } },

    // Lookup buyer info
    {
      $lookup: {
        from: "users",
        localField: "buyer",
        foreignField: "_id",
        as: "buyerInfo",
      },
    },

    // Add buyer object with name and email only
    {
      $addFields: {
        buyer: {
          $cond: {
            if: { $gt: [{ $size: "$buyerInfo" }, 0] },
            then: { 
              _id: { $arrayElemAt: ["$buyerInfo._id", 0] },
              name: { $arrayElemAt: ["$buyerInfo.fullName", 0] },
              email: { $arrayElemAt: ["$buyerInfo.email", 0] },
            },
            else: { name: "Guest User", email: "no-email@guest.com" },
          },
        },
        // Transform products to a simpler structure
        products: {
          $map: {
            input: "$products",
            as: "p",
            in: {
              _id: "$$p.product",
              name: "$$p.name",
              quantity: "$$p.quantity",
              price: "$$p.price",
            },
          },
        },
      },
    },

    // Remove intermediate fields
    { $project: { buyerInfo: 0 } },
  ]);

  res.json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

// ---------------- Get a single order details ----------------
export const getSellerOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user?._id;
  const { orderId } = req.params;

  if (!sellerId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new ApiError(400, "Invalid order ID");

  const order = await Order.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(orderId), seller: new mongoose.Types.ObjectId(sellerId) } },
    // Lookup buyer
    {
      $lookup: {
        from: "users",
        localField: "buyer",
        foreignField: "_id",
        as: "buyer",
      },
    },
    { $unwind: "$buyer" },
    // Lookup product details
    {
      $lookup: {
        from: "products",
        localField: "products.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    // Map products with details
    {
      $addFields: {
        products: {
          $map: {
            input: "$products",
            as: "p",
            in: {
              _id: "$$p.product",
              quantity: "$$p.quantity",
              price: "$$p.price",
              details: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$productDetails",
                      as: "pd",
                      cond: { $eq: ["$$pd._id", "$$p.product"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    },
    { $project: { productDetails: 0 } },
  ]);

  if (!order || order.length === 0) throw new ApiError(404, "Order not found");

  res.json({ success: true, data: order[0] });
});

// ---------------- Update Order Status with Timeline ----------------
export const updateSellerOrderStatusWithTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status, note } = req.body;
  const sellerId = (req as any).user?._id;

  if (!sellerId) throw new ApiError(401, "Unauthorized");

  const validStatuses = ["processing", "completed", "on-hold", "canceled", "refunded"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const order = await Order.findOne({ _id: orderId, seller: sellerId });
  if (!order) throw new ApiError(404, "Order not found");

  if (order.status === status) {
    return res.json(new ApiResponse(200, order, "Order status unchanged"));
  }

  // Avoid duplicate timeline entries within 5 minutes
  const recentTimelineEntry = order.timeline[order.timeline.length - 1];
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  if (
    recentTimelineEntry &&
    recentTimelineEntry.status === status &&
    recentTimelineEntry.timestamp > fiveMinutesAgo
  ) {
    return res.json(new ApiResponse(200, order, "Status already updated recently"));
  }

  const previousStatus = order.status;

  // Update status and timeline
  order.status = status;
  order.timeline.push({
    status,
    timestamp: new Date(),
    note: note || `Status changed from ${previousStatus} to ${status}`,
    updatedBy: sellerId,
  });

  // Save without triggering pre-save timeline logic
  await order.save({ validateBeforeSave: false });

  res.json(new ApiResponse(200, order, "Order status updated successfully"));
});