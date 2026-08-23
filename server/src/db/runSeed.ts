import mongoose from "mongoose";
import { seedRbac, seedAdmin, seedAppConfig, seedRefundPolicies, seedSizeCharts, syncProductVerticals } from "../seed/seed";
import { ENV } from "@/config/env.config";

async function runAllSeeds() {
  console.log("🌱 Starting full database seed...");
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    await seedRbac();
    await seedAdmin();
    await seedAppConfig();
    await seedRefundPolicies();
    await seedSizeCharts();
    await syncProductVerticals();

    console.log("🎉 All Seeding Completed Successfully!");
  } catch (err) {
    console.error("❌ Seed Failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runAllSeeds();
