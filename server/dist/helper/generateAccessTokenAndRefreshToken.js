"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessTokenAndRefreshToken = void 0;
const ApiError_1 = require("../utils/ApiError");
const user_model_1 = require("../models/user.model");
// Generate access token and refresh token for user
const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        // Find the user by ID
        const user = await user_model_1.User.findById(userId);
        if (!user)
            throw new ApiError_1.ApiError(404, "User not found");
        // Generate tokens using instance methods (ensure these exist on your model)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error("Error generating access and refresh tokens:", error);
        throw new ApiError_1.ApiError(500, "Something went wrong while generating tokens");
    }
};
exports.generateAccessTokenAndRefreshToken = generateAccessTokenAndRefreshToken;
