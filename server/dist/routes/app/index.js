"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_routes_1 = __importDefault(require("./product.routes"));
const brand_route_1 = __importDefault(require("./brand.route"));
const category_route_1 = __importDefault(require("./category.route"));
const router = (0, express_1.Router)();
// mount Product routes
router.use("/products", product_routes_1.default);
// mount Brands routes
router.use("/brands", brand_route_1.default);
// mount Category routes
router.use("/categories", category_route_1.default);
exports.default = router;
