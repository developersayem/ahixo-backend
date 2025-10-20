import fs from 'fs';
import path from 'path';
import type { Request, Response } from "express";
import { Product } from "../../models/product.model";
import { User } from "../../models/user.model";
import asyncHandler from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { toPublicUrl } from "../../middlewares/productUpload";

// -------------------- CREATE PRODUCT --------------------
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== "seller") throw new ApiError(403, "Only sellers can create products");

  const {
    title,
    description,
    category,
    brand,
    price,
    salePrice,
    stock,
    tags,
    shippingCost,
    features,
    colors,
    warranty,
    rating,
    currency // ✅ Add currency here
  } = req.body;

  if (!title || !category || !price || !stock) {
    throw new ApiError(400, "Title, category, price, and stock are required.");
  }

  const product = await Product.create({
    seller: userId,
    title: title.trim(),
    description: description?.trim() || "",
    category: category.trim(),
    brand: brand?.trim() || "",
    price: Number(price),
    salePrice: salePrice ? Number(salePrice) : Number(price),
    stock: Number(stock),
    shippingCost: shippingCost ? Number(shippingCost) : 0,
    tags: Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t) => t.trim())
      : [],
    features: Array.isArray(features)
      ? features
      : typeof features === "string"
      ? features.split(",").map((f) => f.trim())
      : [],
    colors: Array.isArray(colors)
      ? colors
      : typeof colors === "string"
      ? colors.split(",").map((c) => c.trim())
      : [],
    warranty: warranty || "",
    rating: rating ? Number(rating) : undefined,
    currency: currency || "USD", // ✅ Save currency, default to USD
    images:
      req.files && Array.isArray(req.files)
        ? (req.files as Express.Multer.File[]).map((file) => toPublicUrl(file.path))
        : [],
  });

  if (!product.images || product.images.length === 0) {
    throw new ApiError(400, "At least one product image is required.");
  }

  res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});


// -------------------- UPDATE PRODUCT --------------------
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== "seller") throw new ApiError(403, "Only sellers can update products");

  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // Destructure incoming fields
  const {
    title,
    description,
    category,
    brand,
    price,
    salePrice,
    stock,
    tags,
    shippingCost,
    features,
    colors,
    warranty,
    rating,
    currency, // ✅ Added currency
    removeImages, // array of image URLs to remove
  } = req.body;

  // ---- Remove images marked for deletion ----
  if (removeImages && Array.isArray(removeImages)) {
    product.images = product.images.filter((img) => !removeImages.includes(img));

    removeImages.forEach((imageUrl: string) => {
      try {
        const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
        const relativePath = imageUrl.replace(backendUrl + "/", "").replace(/\\/g, "/");
        const absolutePath = path.join(process.cwd(), relativePath);

        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
          console.log(`🗑 Deleted image: ${absolutePath}`);
        }
      } catch (err) {
        console.error("Failed to remove image:", err);
      }
    });
  }

  // ---- Add newly uploaded images ----
  if (req.files && Array.isArray(req.files)) {
    const uploadedImages = (req.files as Express.Multer.File[]).map((file) =>
      toPublicUrl(file.path)
    );
    product.images = [...product.images, ...uploadedImages];
  }

  // ---- Update main fields ----
  product.title = title ?? product.title;
  product.description = description ?? product.description;
  product.category = category ?? product.category;
  product.brand = brand ?? product.brand;
  product.warranty = warranty ?? product.warranty;
  product.currency = currency ?? product.currency; // ✅ Update currency

  product.price = price ? Number(price) : product.price;
  product.salePrice = salePrice ? Number(salePrice) : product.salePrice;
  product.stock = stock ? Number(stock) : product.stock;
  product.shippingCost = shippingCost ? Number(shippingCost) : product.shippingCost;
  product.rating = rating ? Number(rating) : product.rating;

  // ---- Update array fields ----
  product.tags = tags
    ? Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t) => t.trim())
      : product.tags
    : product.tags;

  product.features = features
    ? Array.isArray(features)
      ? features
      : typeof features === "string"
      ? features.split(",").map((f) => f.trim())
      : product.features
    : product.features;

  product.colors = colors
    ? Array.isArray(colors)
      ? colors
      : typeof colors === "string"
      ? colors.split(",").map((c) => c.trim())
      : product.colors
    : product.colors;

  // ---- Ensure at least one image exists ----
  if (!product.images || product.images.length === 0) {
    throw new ApiError(400, "At least one product image is required.");
  }

  // ---- Save updated product ----
  const updatedProduct = await product.save();

  res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});


// -------------------- DELETE PRODUCT --------------------
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== "seller") throw new ApiError(403, "Only sellers can delete products");

  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // Delete images from disk
  if (product.images && product.images.length > 0) {
    product.images.forEach((imageUrl) => {
      try {
        const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
        const relativePath = imageUrl.replace(backendUrl + "/", "").replace(/\\/g, "/");
        const absolutePath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    });
  }

  await product.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Product and its media deleted successfully"));
});

// -------------------- GET PRODUCT BY ID --------------------
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.id;
  const product = await Product.findById(productId).populate({
    path: "seller",
    select: "fullName sellerInfo email phone avatar",
  });

  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json(new ApiResponse(200, product, "Product fetched successfully"));
});

// -------------------- GET ALL PRODUCTS FOR LOGGED-IN SELLER --------------------
export const getMyProducts = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const userRole = (req as any).user?.role;
  if (userRole !== "seller") throw new ApiError(403, "Only sellers can access their products");

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const searchQuery: any = { seller: userId };
  if (req.query.title) searchQuery.title = { $regex: req.query.title as string, $options: "i" };
  if (req.query.category) searchQuery.category = req.query.category;

  const total = await Product.countDocuments(searchQuery);
  const products = await Product.find(searchQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json(new ApiResponse(200, {
    products,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  }, "Seller products fetched successfully"));
});
