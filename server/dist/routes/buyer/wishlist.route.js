"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wishlist_controller_1 = require("../../controller/buyer/wishlist.controller");
const router = (0, express_1.Router)();
// GET /api/v1/buyer/wishlist
router.get("/", wishlist_controller_1.getWishlist);
// POST /api/v1/buyer/wishlist/:productId
router.post("/:productId", wishlist_controller_1.addToWishlist);
// DELETE /api/v1/buyer/wishlist/:productId
router.delete("/:productId", wishlist_controller_1.removeFromWishlist);
exports.default = router;
