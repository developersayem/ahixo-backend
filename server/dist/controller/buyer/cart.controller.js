"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = exports.updateCartQuantity = exports.removeFromCart = exports.addToCart = void 0;
const cart_model_1 = require("../../models/cart.model");
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const product_model_1 = require("../../models/product.model");
const ApiError_1 = require("../../utils/ApiError");
const ApiResponse_1 = require("../../utils/ApiResponse");
// ---------------- Add or update item in cart ----------------
exports.addToCart = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const { productId, quantity, selectedColor, selectedSize, warranty, customOptions, } = req.body;
    if (!productId)
        throw new ApiError_1.ApiError(400, "ProductId is required");
    const qty = quantity && quantity > 0 ? quantity : 1;
    // Get product info
    const product = await product_model_1.Product.findById(productId);
    if (!product)
        throw new ApiError_1.ApiError(404, "Product not found");
    let cart = await cart_model_1.Cart.findOne({ buyer: buyerId });
    // Build the new cart item safely
    const newItem = {
        product: productId,
        sellerId: product.seller,
        quantity: qty,
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
        customOptions: customOptions || {},
    };
    if (!cart) {
        // Create new cart
        cart = await cart_model_1.Cart.create({ buyer: buyerId, items: [newItem] });
    }
    else {
        // Check if same product with same options exists
        const itemIndex = cart.items.findIndex((item) => {
            return (item.product.toString() === productId &&
                (item.selectedColor || null) === (selectedColor || null) &&
                (item.selectedSize || null) === (selectedSize || null) &&
                JSON.stringify(item.customOptions || {}) === JSON.stringify(customOptions || {}));
        });
        if (itemIndex > -1) {
            // Increment quantity if item exists
            cart.items[itemIndex].quantity += qty;
        }
        else {
            cart.items.push(newItem);
        }
        await cart.save();
    }
    const updatedCart = await getPopulatedCart(buyerId);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, updatedCart, "Item added to cart successfully"));
});
// ---------------- Remove item from cart ----------------
exports.removeFromCart = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const { itemId } = req.params;
    const cart = await cart_model_1.Cart.findOne({ buyer: buyerId });
    if (!cart)
        throw new ApiError_1.ApiError(404, "Cart not found");
    cart.items = cart.items.filter((item) => item._id?.toString() !== itemId);
    await cart.save();
    const updatedCart = await getPopulatedCart(buyerId);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, updatedCart, "Item removed from cart successfully"));
});
// ---------------- Update quantity of an item ----------------
exports.updateCartQuantity = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const { itemId } = req.params;
    const { quantity } = req.body;
    if (!quantity || quantity < 1)
        throw new Error("Quantity must be at least 1");
    const cart = await cart_model_1.Cart.findOne({ buyer: buyerId });
    if (!cart)
        throw new Error("Cart not found");
    const itemIndex = cart.items.findIndex((item) => item._id?.toString() === itemId);
    if (itemIndex === -1)
        throw new Error("Item not found in cart");
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    const updatedCart = await getPopulatedCart(buyerId);
    res.status(200).json({ success: true, data: updatedCart });
});
// ---------------- Get buyer's cart ----------------
exports.getCart = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const cartData = await getPopulatedCart(buyerId);
    res.status(200).json({ success: true, data: cartData });
});
// ---------------- Helper: populate cart items ----------------
const getPopulatedCart = async (buyerId) => {
    const cartData = await cart_model_1.Cart.aggregate([
        { $match: { buyer: buyerId } },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "productDetails",
            },
        },
        { $unwind: "$productDetails" },
        {
            $project: {
                _id: "$items._id",
                productId: "$productDetails._id",
                name: "$productDetails.title",
                price: "$productDetails.price",
                salePrice: "$productDetails.salePrice",
                stock: "$productDetails.stock",
                colors: "$productDetails.colors",
                warranty: "$productDetails.warranty",
                sellerId: "$productDetails.seller",
                quantity: "$items.quantity",
                selectedColor: "$items.selectedColor",
                selectedSize: "$items.selectedSize",
                customOptions: "$items.customOptions",
                currency: "$productDetails.currency",
                total: { $multiply: ["$productDetails.price", "$items.quantity"] },
                shippingCost: "$productDetails.shippingCost",
                image: { $arrayElemAt: ["$productDetails.images", 0] },
                category: "$productDetails.category",
            },
        },
    ]);
    return cartData;
};
