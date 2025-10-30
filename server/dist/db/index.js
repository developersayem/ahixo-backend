"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uri = process.env.MONGO_URI || "";
const connectDB = async () => {
    const connect = async () => {
        try {
            await mongoose_1.default.connect(uri, {
                serverSelectionTimeoutMS: 5000, // fail fast if DB not reachable
                socketTimeoutMS: 45000, // timeout for idle sockets
                heartbeatFrequencyMS: 10000, // keep-alive interval
            });
            console.log(`✅ MongoDB connected: ${mongoose_1.default.connection.host}`);
        }
        catch (error) {
            console.error("❌ Initial MongoDB connection failed, retrying in 5s...", error);
            setTimeout(connect, 5000);
        }
    };
    // Start first connection
    await connect();
    // Auto-reconnect handlers
    mongoose_1.default.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected. Trying to reconnect...");
        connect();
    });
    mongoose_1.default.connection.on("reconnected", () => {
        console.log("🔄 MongoDB reconnected successfully!");
    });
    mongoose_1.default.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
    });
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;
