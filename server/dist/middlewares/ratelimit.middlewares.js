"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCodeLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.sendCodeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many resend attempts. Please try again later.",
});
