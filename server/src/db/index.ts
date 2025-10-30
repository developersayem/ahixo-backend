import mongoose from "mongoose";

const uri = process.env.MONGO_URI || "";

export const connectDB = async (): Promise<void> => {
  const connect = async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // fail fast if DB not reachable
        socketTimeoutMS: 45000,         // timeout for idle sockets
        heartbeatFrequencyMS: 10000,    // keep-alive interval
      });
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    } catch (error) {
      console.error("❌ Initial MongoDB connection failed, retrying in 5s...", error);
      setTimeout(connect, 5000);
    }
  };

  // Start first connection
  await connect();

  // Auto-reconnect handlers
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. Trying to reconnect...");
    connect();
  });

  mongoose.connection.on("reconnected", () => {
    console.log("🔄 MongoDB reconnected successfully!");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
  });
};

export default connectDB;
