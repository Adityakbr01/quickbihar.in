import mongoose from "mongoose";
import { ENV } from "./env.config";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`\n MongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
