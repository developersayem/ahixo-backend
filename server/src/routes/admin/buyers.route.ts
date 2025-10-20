import express from "express";
import { verifyJWT } from "../../middlewares/auth.middlewares";
import { getAllBuyers, getSingleBuyer } from "../../controller/admin/buyers.controller";

const router = express.Router();


router.get("/", getAllBuyers);
router.get("/:id", getSingleBuyer);

export default router;
