"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../../controller/seller/product.controller");
const productUpload_1 = require("../../middlewares/productUpload");
const router = express_1.default.Router();
// Use dynamic folder for products
router.post("/", (0, productUpload_1.productImagesUpload)("products"), product_controller_1.createProduct);
router.put("/:id", (0, productUpload_1.productImagesUpload)("products"), product_controller_1.updateProduct);
router.delete("/:id", product_controller_1.deleteProduct);
// GET single products for logged-in seller
router.get("/:id", product_controller_1.getProductById);
// GET all products for logged-in seller
router.get("/", product_controller_1.getMyProducts);
exports.default = router;
