"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const categories_controller_1 = require("../../controller/app/categories.controller");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Get all categories (with parent + subcategories)
router.get("/", categories_controller_1.getAllCategories);
router.get("/top", categories_controller_1.getTopCategories);
exports.default = router;
