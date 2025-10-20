import express from "express";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  getProductById,
  getMyProducts,
} from "../../controller/admin/product.controller";
import { productImagesUpload } from "../../middlewares/productUpload";

const router = express.Router();

// Use dynamic folder for products
router.post("/", productImagesUpload("products"), createProduct);
router.put("/:id", productImagesUpload("products"), updateProduct);
router.delete("/:id", deleteProduct);

// GET single products for logged-in admin
router.get("/:id", getProductById);

// GET all products for logged-in admin
router.get("/", getMyProducts); 


export default router;
