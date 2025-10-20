"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("./db/index"));
const app_1 = require("./app");
const socket_1 = require("./socket");
dotenv_1.default.config({
    path: "./.env",
});
const PORT = process.env.PORT || 5000;
(0, index_1.default)()
    .then(() => {
    const server = app_1.app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    // Initialize Socket.IO with HTTP server
    (0, socket_1.initSocket)(server);
})
    .catch((error) => {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
});
// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
    console.error(`Uncaught Exception: ${error.message}\n${error.stack}`);
    process.exit(1);
});
process.on("unhandledRejection", (reason) => {
    console.error(`Unhandled Rejection: ${reason}`);
    process.exit(1);
});
