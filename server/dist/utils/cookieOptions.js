"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieOptions = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isProduction = process.env.NODE_ENV === "production";
// export const cookieOptions: CookieOptions = {
//   httpOnly: true,
//   secure: isProduction, // secure only in production
//   sameSite: isProduction ? "none" : "lax", // lax in local, none in prod
//   domain: isProduction ? ".example.com" : undefined, // no domain for localhost
//   path: "/",
// };
exports.cookieOptions = {
    httpOnly: true, // prevents JS access to the cookie
    secure: false, // must be false on localhost (no HTTPS)
    sameSite: "lax", // allows sending cookies on same-site requests
    path: "/",
};
