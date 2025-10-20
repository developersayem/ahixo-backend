import { Router } from "express";

import { adminRegistrationController, loginController } from "../../controller/admin/auth.controller";
import { getSellerProfileController } from "../../controller/admin/profile.controller";
import { verifyJWT } from "../../middlewares/auth.middlewares";
import overviewRoutes from "../../routes/admin/overview.route"; // all overview routes
import orderRoutes from "../../routes/admin/order.route"; // all order routes
import productsRoutes from "../../routes/admin/product.route"; // all product routes
import applicationRoutes from "../../routes/admin/application.routes"; // all application routes
import sellersRoutes from "../../routes/admin/sellers.route"; // all sellers routes
import buyersRoutes from "../../routes/admin/buyers.route"; // all buyers routes
import categoriesRoutes from "../../routes/admin/category.route"; // all categories routes




const router = Router()

// Route for register seller
router.route("/register").post(
    adminRegistrationController,
)
// Route for login seller
router.route("/login").post(loginController)

// Route For seller profile
router.route("/profile").get(verifyJWT, getSellerProfileController)

// Route For seller profile update
router.route("/profile").put( verifyJWT, getSellerProfileController)

// Mount overview routes
router.use("/overview", verifyJWT, overviewRoutes);

// Mount orders routes
router.use("/orders", verifyJWT, orderRoutes);

// Mount products routes
router.use("/products", verifyJWT, productsRoutes);

// Mount application routes
router.use("/application", verifyJWT, applicationRoutes);

// Mount sellers routes
router.use("/sellers", verifyJWT, sellersRoutes);

// Mount buyers routes
router.use("/buyers", verifyJWT, buyersRoutes);

// Mount buyers routes
router.use("/categories", verifyJWT, categoriesRoutes);




export default router