"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccessTokenController = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const ApiError_1 = require("../../utils/ApiError");
const ApiResponse_1 = require("../../utils/ApiResponse");
const user_model_1 = require("../../models/user.model");
const generateAccessTokenAndRefreshToken_1 = require("../../helper/generateAccessTokenAndRefreshToken");
const cookieOptions_1 = require("../../utils/cookieOptions");
//* ===============  Refresh Access Token ===============
exports.refreshAccessTokenController = (0, asyncHandler_1.default)(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
        throw new ApiError_1.ApiError(401, "No refresh token provided");
    const user = await user_model_1.User.findOne({ refreshToken });
    if (!user)
        throw new ApiError_1.ApiError(401, "Invalid refresh token");
    const { accessToken, refreshToken: newRefreshToken } = await (0, generateAccessTokenAndRefreshToken_1.generateAccessTokenAndRefreshToken)(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();
    res
        .cookie("accessToken", accessToken, cookieOptions_1.cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions_1.cookieOptions);
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, { accessToken }, "Access token refreshed"));
});
