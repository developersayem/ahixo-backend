"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cart_controller_1 = require("../../controller/buyer/cart.controller");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get("/", cart_controller_1.getCart);
router.post("/add", cart_controller_1.addToCart);
router.put("/update/:itemId", cart_controller_1.updateCartQuantity);
router.delete("/remove/:itemId", cart_controller_1.removeFromCart);
exports.default = router;
