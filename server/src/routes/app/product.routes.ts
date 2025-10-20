import express from "express";
import {  getAllProducts, getFlashSaleProducts, getSingleProduct, searchProducts } from "../../controller/app/products.controller";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/flash-sale", getFlashSaleProducts);
router.get("/search", searchProducts);
router.get("/:id", getSingleProduct);


export default router;
