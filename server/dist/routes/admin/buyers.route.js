"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const buyers_controller_1 = require("../../controller/admin/buyers.controller");
const router = express_1.default.Router();
router.get("/", buyers_controller_1.getAllBuyers);
router.get("/:id", buyers_controller_1.getSingleBuyer);
exports.default = router;
