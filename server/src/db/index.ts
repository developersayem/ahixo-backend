import mongoose from "mongoose";

const uri = process.env.MONGO_URI || "mongodb://admin:ahixo123@mongo:27017/?authSource=admin";

const connectDB = async (): Promise<void> => {
  try {
    const connectionInstance = await mongoose.connect(uri);

    console.log(`✅ Database connected! DB Host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("❌ Database connection failed", error);
    process.exit(1);
  }
};

export default connectDB;
