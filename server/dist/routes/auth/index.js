"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const refresh_controller_1 = require("../../controller/auth/refresh.controller");
const auth_common_controller_1 = require("../../controller/auth/auth.common.controller");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const router = (0, express_1.Router)();
router.post("/login", auth_common_controller_1.loginController);
router.post("/refresh-token", refresh_controller_1.refreshAccessTokenController);
router.post("/logout", auth_middlewares_1.verifyJWT, auth_common_controller_1.logoutUser);
//Routes for verify user
router.post("/verify-email", auth_common_controller_1.verifyEmail);
exports.default = router;
