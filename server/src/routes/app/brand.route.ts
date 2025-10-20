import { getAllBrands } from "../../controller/app/brand.controller";
import express from "express";

const router = express.Router();

router.get("/", getAllBrands);


export default router;
