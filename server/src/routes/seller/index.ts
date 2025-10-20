import { Router } from "express";
import { sellerRegistrationController } from "../../controller/seller/auth.controller";
import { getSellerProfileController } from "../../controller/seller/profile.controller";
import { verifyJWT } from "../../middlewares/auth.middlewares";
import overviewRoutes from "../../routes/seller/overview.route"; // all overview routes
import orderRoutes from "../../routes/seller/order.route"; // all order routes
import productsRoutes from "../../routes/seller/product.route"; // all product routes
import applicationRoutes from "../../routes/seller/application.routes"; // all application routes



const router = Router()

// Route for register seller
router.route("/register").post(
    sellerRegistrationController,
)
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


export default router