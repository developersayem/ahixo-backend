"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.getFlashSaleProducts = exports.getSingleProduct = exports.getAllProducts = void 0;
const product_model_1 = require("../../models/product.model");
const mongoose_1 = __importDefault(require("mongoose"));
// ---------------- Get All Products ----------------
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        const filters = {};
        if (category)
            filters.category = category;
        if (search)
            filters.title = { $regex: search, $options: "i" };
        const products = await product_model_1.Product.aggregate([
            { $match: filters },
            {
                $addFields: {
                    averageRating: { $avg: "$ratings.rating" },
                    totalRatings: { $size: "$ratings" },
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) },
            {
                $lookup: {
                    from: "users", // assumes seller is User
                    localField: "seller",
                    foreignField: "_id",
                    as: "seller",
                },
            },
            { $unwind: "$seller" },
            {
                $project: {
                    title: 1,
                    price: 1,
                    salePrice: 1,
                    stock: 1,
                    category: 1,
                    brand: 1,
                    images: 1,
                    tags: 1,
                    features: 1,
                    colors: 1,
                    shippingCost: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    averageRating: 1,
                    totalRatings: 1,
                    currency: 1,
                    "seller._id": 1,
                    "seller.fullName": 1,
                    "seller.email": 1,
                },
            },
        ]);
        res.json(products);
    }
    catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getAllProducts = getAllProducts;
// ---------------- Get Single Product ----------------
const getSingleProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }
        const product = await product_model_1.Product.aggregate([
            { $match: { _id: new mongoose_1.default.Types.ObjectId(id) } },
            {
                $addFields: {
                    averageRating: { $avg: "$ratings.rating" },
                    totalRatings: { $size: "$ratings" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "seller",
                    foreignField: "_id",
                    as: "seller",
                },
            },
            { $unwind: "$seller" },
            {
                $project: {
                    title: 1,
                    description: 1,
                    price: 1,
                    salePrice: 1,
                    stock: 1,
                    category: 1,
                    brand: 1,
                    images: 1,
                    tags: 1,
                    features: 1,
                    colors: 1,
                    shippingCost: 1,
                    warranty: 1,
                    inHouseProduct: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    averageRating: 1,
                    totalRatings: 1,
                    currency: 1,
                    ratings: 1,
                    "seller._id": 1,
                    "seller.fullName": 1,
                    "seller.email": 1,
                },
            },
        ]);
        if (!product.length) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product[0]);
    }
    catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getSingleProduct = getSingleProduct;
// ---------------- Get All Flash Sale Products ----------------
const getFlashSaleProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        const filters = { isFlashSale: true };
        if (category)
            filters.category = category;
        if (search)
            filters.title = { $regex: search, $options: "i" };
        const products = await product_model_1.Product.aggregate([
            { $match: filters },
            {
                $addFields: {
                    averageRating: { $avg: "$ratings.rating" },
                    totalRatings: { $size: "$ratings" },
                },
            },
            { $sort: { createdAt: -1 } }, // latest first
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) },
            {
                $lookup: {
                    from: "users",
                    localField: "seller",
                    foreignField: "_id",
                    as: "seller",
                },
            },
            { $unwind: "$seller" },
            {
                $project: {
                    title: 1,
                    description: 1,
                    price: 1,
                    salePrice: 1,
                    stock: 1,
                    category: 1,
                    brand: 1,
                    images: 1,
                    tags: 1,
                    features: 1,
                    colors: 1,
                    shippingCost: 1,
                    warranty: 1,
                    inHouseProduct: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    averageRating: 1,
                    totalRatings: 1,
                    ratings: 1,
                    currency: 1,
                    "seller._id": 1,
                    "seller.fullName": 1,
                    "seller.email": 1,
                },
            },
        ]);
        res.status(200).json(products);
    }
    catch (error) {
        console.error("Error fetching flash sale products:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getFlashSaleProducts = getFlashSaleProducts;
// ---------------- Search Products ----------------
const searchProducts = async (req, res) => {
    try {
        const { query = "", limit = 10 } = req.query;
        if (!query || typeof query !== "string") {
            return res.status(400).json({ message: "Search query is required" });
        }
        // Build search condition (title, description, tags, brand, category)
        const searchCondition = {
            $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { tags: { $regex: query, $options: "i" } },
                { brand: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } },
            ],
        };
        const products = await product_model_1.Product.aggregate([
            { $match: searchCondition },
            {
                $addFields: {
                    averageRating: { $avg: "$ratings.rating" },
                    totalRatings: { $size: "$ratings" },
                },
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    price: 1,
                    salePrice: 1,
                    images: 1,
                    category: 1,
                    brand: 1,
                    tags: 1,
                    colors: 1,
                    features: 1,
                    stock: 1,
                    shippingCost: 1,
                    currency: 1,
                    averageRating: 1,
                    totalRatings: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $limit: Number(limit) },
        ]);
        if (!products.length) {
            return res.status(404).json({ message: "No products found" });
        }
        res.status(200).json({ results: products.length, products });
    }
    catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.searchProducts = searchProducts;
