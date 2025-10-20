import express from "express";
import { verifyJWT } from "../../middlewares/auth.middlewares";
import { getAllSellers, getSingleSeller } from "../../controller/admin/sellers.controller";

const router = express.Router();

router.get("/", getAllSellers);
router.get("/:id", getSingleSeller);

export default router;
