"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const wishlist_model_1 = require("../../models/wishlist.model");
const ApiError_1 = require("../../utils/ApiError");
const ApiResponse_1 = require("../../utils/ApiResponse");
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
// ---------------- Get wishlist ----------------
exports.getWishlist = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const wishlist = await wishlist_model_1.Wishlist.findOne({ buyer: buyerId }).populate("products", "title price salePrice stock images brand category description");
    if (!wishlist) {
        return res.json(new ApiResponse_1.ApiResponse(200, [], "Wishlist fetched successfully"));
    }
    // Map products into required format
    const formattedProducts = wishlist.products.map((product) => ({
        _id: product._id,
        name: product.title,
        image: product.images?.[0] || "",
        price: product.salePrice || product.price,
        currency: product.currency || "USD",
        originalPrice: product.salePrice ? product.price : undefined,
        status: product.stock === 0
            ? "Out of Stock"
            : product.stock < 5
                ? "Limited Stock"
                : "In Stock",
        category: product.category,
        description: product.description || "",
    }));
    res.json(new ApiResponse_1.ApiResponse(200, formattedProducts, "Wishlist fetched successfully"));
});
// ---------------- Add product from to wishlist ----------------
exports.addToWishlist = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const { productId } = req.params;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    let wishlist = await wishlist_model_1.Wishlist.findOne({ buyer: buyerId });
    if (!wishlist) {
        wishlist = await wishlist_model_1.Wishlist.create({ buyer: buyerId, products: [productId] });
    }
    else {
        if (wishlist.products.includes(productId)) {
            throw new ApiError_1.ApiError(400, "Product already in wishlist");
        }
        wishlist.products.push(productId);
        await wishlist.save();
    }
    res.json(new ApiResponse_1.ApiResponse(200, wishlist, "Product added to wishlist"));
});
// ---------------- Remove product from to wishlist ----------------
exports.removeFromWishlist = (0, asyncHandler_1.default)(async (req, res) => {
    const buyerId = req.user?._id;
    const { productId } = req.params;
    if (!buyerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const wishlist = await wishlist_model_1.Wishlist.findOne({ buyer: buyerId });
    if (!wishlist)
        throw new ApiError_1.ApiError(404, "Wishlist not found");
    wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
    await wishlist.save();
    res.json(new ApiResponse_1.ApiResponse(200, wishlist, "Product removed from wishlist"));
});
