import { Router } from "express";
import { createCategory, deleteCategory, editCategory, getAllCategories, getParentCategories } from "../../controller/admin/category.controller";


const router = Router();

// =============================
// 📍 Category Routes
// =============================

// Create category
router.post("/", createCategory);

// Get all categories (with parent + subcategories)
router.get("/", getAllCategories);

// Get all parent categories (no parentCategory)
router.get("/parents", getParentCategories);

// Edit category
router.patch("/:id", editCategory);

// Delete category
router.delete("/:id", deleteCategory);

export default router;
