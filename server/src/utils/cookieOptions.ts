import { CookieOptions } from "express";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// export const cookieOptions: CookieOptions = {
//   httpOnly: true,
//   secure: isProduction, // secure only in production
//   sameSite: isProduction ? "none" : "lax", // lax in local, none in prod
//   domain: isProduction ? ".example.com" : undefined, // no domain for localhost
//   path: "/",
// };
export const cookieOptions: CookieOptions = {
  httpOnly: true,          // prevents JS access to the cookie
  secure: false,           // must be false on localhost (no HTTPS)
  sameSite: "lax",         // allows sending cookies on same-site requests
  path: "/", 
};
