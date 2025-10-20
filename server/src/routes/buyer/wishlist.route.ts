import { Router } from "express";
import { addToWishlist, getWishlist, removeFromWishlist } from "../../controller/buyer/wishlist.controller";


const router = Router();

// GET /api/v1/buyer/wishlist
router.get("/", getWishlist);

// POST /api/v1/buyer/wishlist/:productId
router.post("/:productId", addToWishlist);

// DELETE /api/v1/buyer/wishlist/:productId
router.delete("/:productId", removeFromWishlist);

export default router;
