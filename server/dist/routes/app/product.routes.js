"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const products_controller_1 = require("../../controller/app/products.controller");
const router = express_1.default.Router();
router.get("/", products_controller_1.getAllProducts);
router.get("/flash-sale", products_controller_1.getFlashSaleProducts);
router.get("/search", products_controller_1.searchProducts);
router.get("/:id", products_controller_1.getSingleProduct);
exports.default = router;
