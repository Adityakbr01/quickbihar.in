import mongoose from "mongoose";
import { seedSizeCharts, seedRefundPolicies } from "../seed/seed";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI environment variable is not defined");
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    await seedSizeCharts();
    await seedRefundPolicies();
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
}

run().catch(console.error);
