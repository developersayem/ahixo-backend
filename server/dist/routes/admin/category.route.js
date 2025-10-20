"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../../controller/admin/category.controller");
const router = (0, express_1.Router)();
// =============================
// 📍 Category Routes
// =============================
// Create category
router.post("/", category_controller_1.createCategory);
// Get all categories (with parent + subcategories)
router.get("/", category_controller_1.getAllCategories);
// Get all parent categories (no parentCategory)
router.get("/parents", category_controller_1.getParentCategories);
// Edit category
router.patch("/:id", category_controller_1.editCategory);
// Delete category
router.delete("/:id", category_controller_1.deleteCategory);
exports.default = router;
