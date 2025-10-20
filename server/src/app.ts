import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { loggerMiddleware } from "./middlewares/loggerMiddleware";
import session from "express-session";
import {errorHandler} from "./middlewares/error.middlewares"
import path from "path";




const app = express();

// Your frontend origin
// const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(origin => origin.trim()) || [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || process.env.ALLOWED_ORIGINS?.split(",").includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.set("trust proxy", 1); //   Required when behind proxy (e.g. Webuzo/Nginx)



// Multer setup (memory storage, max 5MB file size)
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// set trust proxy
app.set("trust proxy", 1);
// Parse JSON and URL-encoded bodies for routes NOT expecting multipart/form-data
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Parse cookies
app.use(cookieParser());
// Serve files in public folder
app.use("/public", express.static(path.join(process.cwd(), "public")));



// Use custom logger middleware early
app.use(loggerMiddleware);

 // Passport.js setup
 app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);



// server-cheacker
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Import routes
import appRoutes from "./routes/app/index"
import authRoutes from "./routes/auth/index";
import sellerRoutes from "./routes/seller/index";
import buyerRoutes from "./routes/buyer/index";
import adminRoutes from "./routes/admin/index";
import conversationRoutes from "./routes/messages/conversations.route";
import messagesRoutes from "./routes/messages/message.routes";

// Use routes
app.use("/api/v1", appRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/buyer", buyerRoutes);
app.use("/api/v1/seller", sellerRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/messages", messagesRoutes);




// custom error middlewares
app.use(errorHandler)
export { app };
