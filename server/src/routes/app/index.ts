import { Router } from "express";
import productsRoutes from "./product.routes";
import brandRoutes from "./brand.route";
import categoryRoutes from "./category.route";


const router = Router()

// mount Product routes
router.use("/products", productsRoutes)

// mount Brands routes
router.use("/brands", brandRoutes)

// mount Category routes
router.use("/categories", categoryRoutes)



export default router