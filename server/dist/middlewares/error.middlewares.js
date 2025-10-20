"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ApiError_1 = require("../utils/ApiError");
const errorHandler = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof ApiError_1.ApiError)) {
        const isMongooseError = error instanceof mongoose_1.default.Error;
        const statusCode = error.statusCode || (isMongooseError ? 400 : 500);
        const message = error.message || "Something went wrong";
        error = new ApiError_1.ApiError(statusCode, message, error.error || [], error.stack || "");
    }
    const response = {
        statusCode: error.statusCode,
        message: error.message,
        error: error.error || [],
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    };
    // Just send the response; don't return anything
    res.status(error.statusCode).json(response);
};
exports.errorHandler = errorHandler;
