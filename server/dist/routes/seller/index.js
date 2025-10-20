"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../../controller/seller/auth.controller");
const profile_controller_1 = require("../../controller/seller/profile.controller");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const overview_route_1 = __importDefault(require("../../routes/seller/overview.route")); // all overview routes
const order_route_1 = __importDefault(require("../../routes/seller/order.route")); // all order routes
const product_route_1 = __importDefault(require("../../routes/seller/product.route")); // all product routes
const application_routes_1 = __importDefault(require("../../routes/seller/application.routes")); // all application routes
const router = (0, express_1.Router)();
// Route for register seller
router.route("/register").post(auth_controller_1.sellerRegistrationController);
// Route For seller profile
router.route("/profile").get(auth_middlewares_1.verifyJWT, profile_controller_1.getSellerProfileController);
// Route For seller profile update
router.route("/profile").put(auth_middlewares_1.verifyJWT, profile_controller_1.getSellerProfileController);
// Mount overview routes
router.use("/overview", auth_middlewares_1.verifyJWT, overview_route_1.default);
// Mount orders routes
router.use("/orders", auth_middlewares_1.verifyJWT, order_route_1.default);
// Mount products routes
router.use("/products", auth_middlewares_1.verifyJWT, product_route_1.default);
// Mount application routes
router.use("/application", auth_middlewares_1.verifyJWT, application_routes_1.default);
exports.default = router;
