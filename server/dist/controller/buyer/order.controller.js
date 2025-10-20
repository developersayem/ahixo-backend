"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = exports.removeOrderItem = exports.cancelOrder = exports.updateBuyerOrderStatusWithTimeline = exports.getBuyerOrderDetails = exports.getBuyerOrders = exports.getBuyerOrderStats = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const order_model_1 = require("../../models/order.model");
const ApiError_1 = require("../../utils/ApiError");
const mongoose_1 = __importDefault(require("mongoose"));
const ApiResponse_1 = require("../../utils/ApiResponse");
const product_model_1 = require("../../models/product.model");
const cart_model_1 = require("../../models/cart.model");
// ---------------- Get buyer Order Stats ----------------
exports.getBuyerOrderStats = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const buyerObjectId = typeof buyerId === "string" ? new mongoose_1.default.Types.ObjectId(buyerId) : buyerId;
    // Aggregate counts
    const stats = await order_model_1.Order.aggregate([
        { $match: { buyer: buyerObjectId } },
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
    res.json(new ApiResponse_1.ApiResponse(200, result, "buyer order stats fetched successfully"));
});
// ---------------- Get all orders for a buyer ----------------
exports.getBuyerOrders = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const buyerObjectId = typeof buyerId === "string" ? new mongoose_1.default.Types.ObjectId(buyerId) : buyerId;
    const orders = await order_model_1.Order.aggregate([
        { $match: { buyer: buyerObjectId } },
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
        // Lookup products info
        {
            $lookup: {
                from: "products",
                localField: "products.product",
                foreignField: "_id",
                as: "productDocs",
            },
        },
        // Add buyer & product fields
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
                // Merge products with productDocs
                products: {
                    $map: {
                        input: "$products",
                        as: "p",
                        in: {
                            $mergeObjects: [
                                "$$p",
                                {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$productDocs",
                                                as: "prod",
                                                cond: { $eq: ["$$prod._id", "$$p.product"] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
        },
        // Clean up
        { $project: { buyerInfo: 0, productDocs: 0 } },
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, orders, "Orders fetched successfully"));
});
// ---------------- Get a single order details ----------------
exports.getBuyerOrderDetails = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const { orderId } = req.params;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (!mongoose_1.default.Types.ObjectId.isValid(orderId))
        throw new ApiError_1.ApiError(400, "Invalid order ID");
    const order = await order_model_1.Order.aggregate([
        { $match: { _id: new mongoose_1.default.Types.ObjectId(orderId), buyer: new mongoose_1.default.Types.ObjectId(buyerId) } },
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
exports.updateBuyerOrderStatusWithTimeline = (0, asyncHandler_1.default)(async (req, res) => {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const buyerId = req.user?._id;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const validStatuses = ["processing", "completed", "on-hold", "canceled", "refunded"];
    if (!validStatuses.includes(status)) {
        throw new ApiError_1.ApiError(400, "Invalid status");
    }
    const order = await order_model_1.Order.findOne({ _id: orderId, buyer: buyerId });
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
        updatedBy: buyerId,
    });
    // Save without triggering pre-save timeline logic
    await order.save({ validateBeforeSave: false });
    res.json(new ApiResponse_1.ApiResponse(200, order, "Order status updated successfully"));
});
// ---------------- Cancel an order ----------------
exports.cancelOrder = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const { orderId } = req.params;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    // Find order
    const order = await order_model_1.Order.findOne({ _id: orderId, buyer: buyerId });
    if (!order)
        throw new ApiError_1.ApiError(404, "Order not found");
    // Prevent cancel if already delivered/canceled
    if (order.status === "delivered") {
        throw new ApiError_1.ApiError(400, "Delivered orders cannot be canceled");
    }
    if (order.status === "canceled") {
        throw new ApiError_1.ApiError(400, "Order already canceled");
    }
    // Update status
    order.status = "canceled";
    await order.save();
    res.json(new ApiResponse_1.ApiResponse(200, order, "Order canceled successfully"));
});
// ---------------- Remove product from an order ----------------
exports.removeOrderItem = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const { orderId, productId } = req.params;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    // Find the order
    const order = await order_model_1.Order.findOne({ _id: orderId, buyer: buyerId });
    if (!order)
        throw new ApiError_1.ApiError(404, "Order not found");
    // Only allow removal if status = processing
    if (order.status !== "processing") {
        throw new ApiError_1.ApiError(400, "Items can only be removed while order is processing");
    }
    // Check if product exists in order
    const itemIndex = order.products.findIndex((p) => p._id.toString() === productId || p.product.toString() === productId);
    if (itemIndex === -1) {
        throw new ApiError_1.ApiError(404, "Product not found in order");
    }
    // Remove item
    order.products.splice(itemIndex, 1);
    // Recalculate total
    order.total = order.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    // Save updated order
    await order.save();
    res.json(new ApiResponse_1.ApiResponse(200, order, "Product removed from order successfully"));
});
// ---------------- Create Order ----------------
exports.createOrder = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const { products, shippingAddress, note, phone, paymentMethod, currency } = req.body;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (!products || !Array.isArray(products) || products.length === 0)
        throw new ApiError_1.ApiError(400, "Products are required");
    if (!shippingAddress)
        throw new ApiError_1.ApiError(400, "Shipping address is required");
    const createdOrders = [];
    // Step 1: Fetch products from DB and attach seller info
    const productsWithSeller = await Promise.all(products.map(async (p) => {
        const productFromDB = await product_model_1.Product.findById(p.product);
        if (!productFromDB)
            throw new ApiError_1.ApiError(400, `Product not found: ${p.product}`);
        if (!productFromDB.seller)
            throw new ApiError_1.ApiError(400, `Product missing seller: ${p.product}`);
        const price = productFromDB.salePrice && productFromDB.salePrice < productFromDB.price
            ? productFromDB.salePrice
            : productFromDB.price;
        return {
            product: p.product,
            quantity: p.quantity,
            price,
            title: productFromDB.title,
            seller: productFromDB.seller.toString(),
            shippingCost: productFromDB.shippingCost || 0,
            currency: currency || productFromDB.currency || "USD",
        };
    }));
    // Step 2: Group products by seller
    const itemsBySeller = {};
    productsWithSeller.forEach((item) => {
        if (!itemsBySeller[item.seller])
            itemsBySeller[item.seller] = [];
        itemsBySeller[item.seller].push(item);
    });
    // Step 3: Create orders per seller
    for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const subtotal = items.reduce((sum, p) => sum + p.price * p.quantity, 0);
        const totalShippingCost = items.reduce((sum, p) => sum + (p.shippingCost || 0), 0);
        const total = subtotal + totalShippingCost;
        const order = new order_model_1.Order({
            seller: sellerId,
            buyer: buyerId,
            products: items.map((p) => ({
                product: p.product,
                quantity: p.quantity,
                price: p.price,
                title: p.title,
                shippingCost: p.shippingCost,
                currency: p.currency,
            })),
            subtotal,
            totalShippingCost,
            total,
            shippingAddress,
            phone,
            paymentMethod: paymentMethod || "cod",
            currency: currency || "USD",
            status: "processing",
            timeline: [
                {
                    status: "processing",
                    timestamp: new Date(),
                    note: note || "Order created",
                    updatedBy: buyerId,
                },
            ],
        });
        await order.save();
        createdOrders.push(order);
    }
    // Step 4: Clear buyer's cart
    await cart_model_1.Cart.deleteMany({ buyer: buyerId });
    res.status(201).json(new ApiResponse_1.ApiResponse(201, createdOrders, "Orders created successfully"));
});
