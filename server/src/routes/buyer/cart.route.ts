import { addToCart, getCart, removeFromCart, updateCartQuantity } from "../../controller/buyer/cart.controller";
import express from "express";


const router = express.Router();


router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update/:itemId", updateCartQuantity);
router.delete("/remove/:itemId", removeFromCart);

export default router;
