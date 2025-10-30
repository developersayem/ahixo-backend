"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("./db/index"));
const app_1 = require("./app");
const socket_1 = require("./socket");
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config({ path: "./.env" });
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        await (0, index_1.default)();
        const server = app_1.app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
        // Initialize Socket.IO
        (0, socket_1.initSocket)(server);
        // Keep app alive — handle DB disconnects gracefully
        mongoose_1.default.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB lost connection. Retrying...");
        });
        mongoose_1.default.connection.on("reconnected", () => {
            console.log("✅ MongoDB reconnected.");
        });
        // Optional — ping self every 4 minutes to prevent idle sleep (works in Coolify/VPS)
        setInterval(() => {
            fetch(`http://localhost:${PORT}/`).catch(() => { });
        }, 1000 * 60 * 4); // every 4 minutes
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
// Global exception handlers
process.on("uncaughtException", (error) => {
    console.error(`💥 Uncaught Exception: ${error.message}`);
    console.error(error.stack);
});
process.on("unhandledRejection", (reason) => {
    console.error(`🚨 Unhandled Rejection: ${reason}`);
});
// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("🧹 Gracefully shutting down...");
    try {
        await mongoose_1.default.connection.close();
        console.log("🛑 MongoDB connection closed.");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error closing MongoDB connection:", error);
        process.exit(1);
    }
});
