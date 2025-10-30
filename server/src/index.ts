import dotenv from "dotenv";
import connectDB from "./db/index";
import { app } from "./app";
import { initSocket } from "./socket";
import mongoose from "mongoose";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });

    // Initialize Socket.IO
    initSocket(server);

    // Keep app alive — handle DB disconnects gracefully
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB lost connection. Retrying...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected.");
    });

    // Optional — ping self every 4 minutes to prevent idle sleep (works in Coolify/VPS)
    setInterval(() => {
      fetch(`http://localhost:${PORT}/`).catch(() => {});
    }, 1000 * 60 * 4); // every 4 minutes

  } catch (error) {
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
    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
    process.exit(1);
  }
});
