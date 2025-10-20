import { Request, Response } from "express";
import { Wishlist } from "../../models/wishlist.model";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";


// ---------------- Get wishlist ----------------
export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = (req as any).user?._id;

  if (!buyerId) throw new ApiError(401, "Unauthorized");

  const wishlist = await Wishlist.findOne({ buyer: buyerId }).populate(
    "products",
    "title price salePrice stock images brand category description"
  );

  if (!wishlist) {
    return res.json(new ApiResponse(200, [], "Wishlist fetched successfully"));
  }

  // Map products into required format
  const formattedProducts = wishlist.products.map((product: any) => ({
    _id: product._id,
    name: product.title,
    image: product.images?.[0] || "",
    price: product.salePrice || product.price,
    currency: product.currency || "USD",
    originalPrice: product.salePrice ? product.price : undefined,
    status:
      product.stock === 0
        ? "Out of Stock"
        : product.stock < 5
        ? "Limited Stock"
        : "In Stock",
    category: product.category,
    description: product.description || "",
  }));

  res.json(new ApiResponse(200, formattedProducts, "Wishlist fetched successfully"));
});

// ---------------- Add product from to wishlist ----------------
export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = (req as any).user?._id;
  const { productId } = req.params;

  if (!buyerId) throw new ApiError(401, "Unauthorized");

  let wishlist = await Wishlist.findOne({ buyer: buyerId });

  if (!wishlist) {
    wishlist = await Wishlist.create({ buyer: buyerId, products: [productId] });
  } else {
    if (wishlist.products.includes(productId as any)) {
      throw new ApiError(400, "Product already in wishlist");
    }
    wishlist.products.push(productId as any);
    await wishlist.save();
  }

  res.json(new ApiResponse(200, wishlist, "Product added to wishlist"));
});

// ---------------- Remove product from to wishlist ----------------
export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = (req as any).user?._id;
  const { productId } = req.params;

  if (!buyerId) throw new ApiError(401, "Unauthorized");

  const wishlist = await Wishlist.findOne({ buyer: buyerId });
  if (!wishlist) throw new ApiError(404, "Wishlist not found");

  wishlist.products = wishlist.products.filter(
    (p) => p.toString() !== productId
  );

  await wishlist.save();

  res.json(new ApiResponse(200, wishlist, "Product removed from wishlist"));
});

