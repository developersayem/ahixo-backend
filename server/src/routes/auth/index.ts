import { Router } from "express";
import { refreshAccessTokenController } from "../../controller/auth/refresh.controller";
import { loginController, logoutUser, verifyEmail } from "../../controller/auth/auth.common.controller";
import { verifyJWT } from "../../middlewares/auth.middlewares";


const router = Router()


router.post("/login", loginController);

router.post("/refresh-token", refreshAccessTokenController);

router.post("/logout", verifyJWT, logoutUser);

//Routes for verify user
router.post("/verify-email", verifyEmail);

export default router