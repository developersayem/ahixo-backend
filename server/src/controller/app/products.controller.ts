import type{ Request, Response } from "express";
import { Product } from "../../models/product.model";
import mongoose from "mongoose";

// ---------------- Get All Products ----------------
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    const filters: any = {};

    if (category) filters.category = category;
    if (search) filters.title = { $regex: search as string, $options: "i" };

    const products = await Product.aggregate([
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
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- Get Single Product ----------------
export const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- Get All Flash Sale Products ----------------
export const getFlashSaleProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    const filters: any = { isFlashSale: true };

    if (category) filters.category = category;
    if (search) filters.title = { $regex: search as string, $options: "i" };

    const products = await Product.aggregate([
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
  } catch (error) {
    console.error("Error fetching flash sale products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- Search Products ----------------
export const searchProducts = async (req: Request, res: Response) => {
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

    const products = await Product.aggregate([
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
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};