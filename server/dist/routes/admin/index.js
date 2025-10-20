"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../../controller/admin/auth.controller");
const profile_controller_1 = require("../../controller/admin/profile.controller");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const overview_route_1 = __importDefault(require("../../routes/admin/overview.route")); // all overview routes
const order_route_1 = __importDefault(require("../../routes/admin/order.route")); // all order routes
const product_route_1 = __importDefault(require("../../routes/admin/product.route")); // all product routes
const application_routes_1 = __importDefault(require("../../routes/admin/application.routes")); // all application routes
const sellers_route_1 = __importDefault(require("../../routes/admin/sellers.route")); // all sellers routes
const buyers_route_1 = __importDefault(require("../../routes/admin/buyers.route")); // all buyers routes
const category_route_1 = __importDefault(require("../../routes/admin/category.route")); // all categories routes
const router = (0, express_1.Router)();
// Route for register seller
router.route("/register").post(auth_controller_1.adminRegistrationController);
// Route for login seller
router.route("/login").post(auth_controller_1.loginController);
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
// Mount sellers routes
router.use("/sellers", auth_middlewares_1.verifyJWT, sellers_route_1.default);
// Mount buyers routes
router.use("/buyers", auth_middlewares_1.verifyJWT, buyers_route_1.default);
// Mount buyers routes
router.use("/categories", auth_middlewares_1.verifyJWT, category_route_1.default);
exports.default = router;
