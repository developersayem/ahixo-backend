"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../../controller/buyer/auth.controller");
const profile_controller_1 = require("../../controller/seller/profile.controller");
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const order_route_1 = __importDefault(require("../../routes/buyer/order.route"));
const wishlist_route_1 = __importDefault(require("../../routes/buyer/wishlist.route"));
const cart_route_1 = __importDefault(require("../../routes/buyer/cart.route"));
const router = (0, express_1.Router)();
// Route for register buyer
router.route("/register").post(auth_controller_1.buyerRegistrationController);
// Route For seller profile update
router.route("/profile").put(auth_middlewares_1.verifyJWT, profile_controller_1.getSellerProfileController);
// mount order routes
router.use("/orders", auth_middlewares_1.verifyJWT, order_route_1.default);
// mount wishlist routes
router.use("/wishlist", auth_middlewares_1.verifyJWT, wishlist_route_1.default);
// mount cart routes
router.use("/cart", auth_middlewares_1.verifyJWT, cart_route_1.default);
exports.default = router;
