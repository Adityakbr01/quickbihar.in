/**
 * Migration 001 — add `identities` array to all users.
 *
 * Idempotent: re-running is safe — $exists:false matches only documents
 * that don't yet have the field.
 *
 * Run: bun run src/db/migrations/001-add-identities-array.ts
 */
import mongoose from "mongoose";
import { ENV } from "../../config/env.config";
import { User } from "../../modules/common/user/user.model";

async function main() {
  await mongoose.connect(ENV.MONGODB_URI);
  console.log("Connected to MongoDB");

  const result = await User.updateMany(
    { identities: { $exists: false } },
    { $set: { identities: [] } }
  );

  console.log(
    `Migration 001 complete: matched=${result.matchedCount}, modified=${result.modifiedCount}`
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Migration 001 failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});