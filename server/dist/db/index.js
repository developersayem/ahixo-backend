"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv/config");
// Use Docker service name and correct credentials
const uri = process.env.MONGO_URI || "mongodb://admin:ahixo123@mongo:27017/?authSource=admin";
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose_1.default.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }); // TS type cast
        console.log(`\n✅ Database connected! DB Host: ${connectionInstance.connection.host}`);
    }
    catch (error) {
        console.error("❌ Database connection failed", error);
        process.exit(1);
    }
};
exports.default = connectDB;
