"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sellers_controller_1 = require("../../controller/admin/sellers.controller");
const router = express_1.default.Router();
router.get("/", sellers_controller_1.getAllSellers);
router.get("/:id", sellers_controller_1.getSingleSeller);
exports.default = router;
