import { getAllCategories, getTopCategories } from "../../controller/app/categories.controller";
import express from "express";


const router = express.Router();

// Get all categories (with parent + subcategories)
router.get("/", getAllCategories);
router.get("/top", getTopCategories);


export default router;
