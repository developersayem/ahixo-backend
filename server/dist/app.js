"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.upload = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const multer_1 = __importDefault(require("multer"));
const loggerMiddleware_1 = require("./middlewares/loggerMiddleware");
const express_session_1 = __importDefault(require("express-session"));
const error_middlewares_1 = require("./middlewares/error.middlewares");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
exports.app = app;
// Your frontend origin
// const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(origin => origin.trim()) || [];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || process.env.ALLOWED_ORIGINS?.split(",").includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.set("trust proxy", 1); //   Required when behind proxy (e.g. Webuzo/Nginx)
// Multer setup (memory storage, max 5MB file size)
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
// set trust proxy
app.set("trust proxy", 1);
// Parse JSON and URL-encoded bodies for routes NOT expecting multipart/form-data
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Parse cookies
app.use((0, cookie_parser_1.default)());
// Serve files in public folder
app.use("/public", express_1.default.static(path_1.default.join(process.cwd(), "public")));
// Use custom logger middleware early
app.use(loggerMiddleware_1.loggerMiddleware);
// Passport.js setup
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true,
}));
// server-cheacker
app.get("/", (req, res) => {
    res.send("Server is running");
});
// Import routes
const index_1 = __importDefault(require("./routes/app/index"));
const index_2 = __importDefault(require("./routes/auth/index"));
const index_3 = __importDefault(require("./routes/seller/index"));
const index_4 = __importDefault(require("./routes/buyer/index"));
const index_5 = __importDefault(require("./routes/admin/index"));
const conversations_route_1 = __importDefault(require("./routes/messages/conversations.route"));
const message_routes_1 = __importDefault(require("./routes/messages/message.routes"));
// Use routes
app.use("/api/v1", index_1.default);
app.use("/api/v1/auth", index_2.default);
app.use("/api/v1/buyer", index_4.default);
app.use("/api/v1/seller", index_3.default);
app.use("/api/v1/admin", index_5.default);
app.use("/api/v1/conversations", conversations_route_1.default);
app.use("/api/v1/messages", message_routes_1.default);
// custom error middlewares
app.use(error_middlewares_1.errorHandler);
