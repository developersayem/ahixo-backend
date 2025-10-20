import { Request, Response } from "express";
import { Cart, ICartItem } from "../../models/cart.model";
import asyncHandler from "../../utils/asyncHandler";
import mongoose from "mongoose";
import { Product } from "../../models/product.model";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";

// ---------------- Add or update item in cart ----------------
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = (req as any).user?._id as mongoose.Types.ObjectId;
  const {
    productId,
    quantity,
    selectedColor,
    selectedSize,
    warranty,
    customOptions,
  } = req.body;

  if (!productId) throw new ApiError(400, "ProductId is required");

  const qty: number = quantity && quantity > 0 ? quantity : 1;

  // Get product info
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  let cart = await Cart.findOne({ buyer: buyerId });

  // Build the new cart item safely
  const newItem: ICartItem = {
    product: productId,
    sellerId: product.seller as mongoose.Types.ObjectId,
    quantity: qty,
    selectedColor: selectedColor || null,
    selectedSize: selectedSize || null,
    customOptions: customOptions || {},
  };

  if (!cart) {
    // Create new cart
    cart = await Cart.create({ buyer: buyerId, items: [newItem] });
  } else {
    // Check if same product with same options exists

    const itemIndex = cart.items.findIndex((item) => {
      return (
        item.product.toString() === productId &&
        (item.selectedColor || null) === (selectedColor || null) &&
        (item.selectedSize || null) === (selectedSize || null) &&
        JSON.stringify(item.customOptions || {}) === JSON.stringify(customOptions || {})
      );
    });

    if (itemIndex > -1) {
      // Increment quantity if item exists
      cart.items[itemIndex].quantity += qty;
    } else {
      cart.items.push(newItem);
    }

    await cart.save();

  }

  const updatedCart = await getPopulatedCart(buyerId);
  res.status(200).json(new ApiResponse(200, updatedCart, "Item added to cart successfully"));
});

// ---------------- Remove item from cart ----------------
export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = (req as any).user?._id as mongoose.Types.ObjectId;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ buyer: buyerId });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = cart.items.filter((item) => item._id?.toString() !== itemId);
  await cart.save();

  const updatedCart = await getPopulatedCart(buyerId);
  res.status(200).json(
    new ApiResponse(200, updatedCart, "Item removed from cart successfully")
  );
});

// ---------------- Update quantity of an item ----------------
export const updateCartQuantity = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = (req as any).user?._id as mongoose.Types.ObjectId;
  const { itemId } = req.params;
  const { quantity } = req.body as { quantity: number };

  if (!quantity || quantity < 1) throw new Error("Quantity must be at least 1");

  const cart = await Cart.findOne({ buyer: buyerId });
  if (!cart) throw new Error("Cart not found");

  const itemIndex = cart.items.findIndex((item) => item._id?.toString() === itemId);
  if (itemIndex === -1) throw new Error("Item not found in cart");

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  const updatedCart = await getPopulatedCart(buyerId);
  res.status(200).json({ success: true, data: updatedCart });
});

// ---------------- Get buyer's cart ----------------
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = (req as any).user?._id as mongoose.Types.ObjectId;
  const cartData = await getPopulatedCart(buyerId);
  res.status(200).json({ success: true, data: cartData });
});

// ---------------- Helper: populate cart items ----------------
const getPopulatedCart = async (buyerId: mongoose.Types.ObjectId) => {
  const cartData = await Cart.aggregate([
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

  return cartData as Array<{
    _id: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    salePrice?: number;
    stock: number;
    colors?: string[];
    warranty?: boolean;
    sellerId: mongoose.Types.ObjectId;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
    customOptions?: Record<string, string>;
    total: number;
    shippingCost?: number;
    image?: string;
    category?: string;
  }>;
};
