import mongoose from "mongoose";
import { RefundPolicy } from "../modules/refundPolicy/refundPolicy.model";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");
    const policies = await RefundPolicy.find({}).lean();
    console.log(JSON.stringify(policies, null, 2));
    await mongoose.disconnect();
}

run().catch(console.error);
