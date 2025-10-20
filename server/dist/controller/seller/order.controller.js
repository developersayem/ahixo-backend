"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSellerOrderStatusWithTimeline = exports.getSellerOrderDetails = exports.getSellerOrders = exports.getSellerOrderStats = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const order_model_1 = require("../../models/order.model");
const ApiError_1 = require("../../utils/ApiError");
const mongoose_1 = __importDefault(require("mongoose"));
const ApiResponse_1 = require("../../utils/ApiResponse");
// ---------------- Get Seller Order Stats ----------------
exports.getSellerOrderStats = (0, asyncHandler_1.default)(async (req, res) => {
    const sellerId = req.user?._id;
    if (!sellerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const sellerObjectId = typeof sellerId === "string" ? new mongoose_1.default.Types.ObjectId(sellerId) : sellerId;
    // Aggregate counts
    const stats = await order_model_1.Order.aggregate([
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
    const statusMap = {};
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
    res.json(new ApiResponse_1.ApiResponse(200, result, "Seller order stats fetched successfully"));
});
// ---------------- Get all orders for a seller ----------------
exports.getSellerOrders = (0, asyncHandler_1.default)(async (req, res) => {
    const sellerId = req.user?._id;
    if (!sellerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const sellerObjectId = typeof sellerId === "string" ? new mongoose_1.default.Types.ObjectId(sellerId) : sellerId;
    const orders = await order_model_1.Order.aggregate([
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
    res.json(new ApiResponse_1.ApiResponse(200, orders, "Orders fetched successfully"));
});
// ---------------- Get a single order details ----------------
exports.getSellerOrderDetails = (0, asyncHandler_1.default)(async (req, res) => {
    const sellerId = req.user?._id;
    const { orderId } = req.params;
    if (!sellerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (!mongoose_1.default.Types.ObjectId.isValid(orderId))
        throw new ApiError_1.ApiError(400, "Invalid order ID");
    const order = await order_model_1.Order.aggregate([
        { $match: { _id: new mongoose_1.default.Types.ObjectId(orderId), seller: new mongoose_1.default.Types.ObjectId(sellerId) } },
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
    if (!order || order.length === 0)
        throw new ApiError_1.ApiError(404, "Order not found");
    res.json({ success: true, data: order[0] });
});
// ---------------- Update Order Status with Timeline ----------------
exports.updateSellerOrderStatusWithTimeline = (0, asyncHandler_1.default)(async (req, res) => {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const sellerId = req.user?._id;
    if (!sellerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const validStatuses = ["processing", "completed", "on-hold", "canceled", "refunded"];
    if (!validStatuses.includes(status)) {
        throw new ApiError_1.ApiError(400, "Invalid status");
    }
    const order = await order_model_1.Order.findOne({ _id: orderId, seller: sellerId });
    if (!order)
        throw new ApiError_1.ApiError(404, "Order not found");
    if (order.status === status) {
        return res.json(new ApiResponse_1.ApiResponse(200, order, "Order status unchanged"));
    }
    // Avoid duplicate timeline entries within 5 minutes
    const recentTimelineEntry = order.timeline[order.timeline.length - 1];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (recentTimelineEntry &&
        recentTimelineEntry.status === status &&
        recentTimelineEntry.timestamp > fiveMinutesAgo) {
        return res.json(new ApiResponse_1.ApiResponse(200, order, "Status already updated recently"));
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
    res.json(new ApiResponse_1.ApiResponse(200, order, "Order status updated successfully"));
});
