/**
 * Migration 002 — flag users originally created by the OTP flow.
 *
 * Heuristic: any user whose email matches the synthetic
 * `<10digits>@quickbihar.local` pattern (mobile-OTP) is flagged.
 *
 * Run: bun run src/db/migrations/002-flag-legacy-otp-users.ts
 */
import mongoose from "mongoose";
import { ENV } from "../../config/env.config";
import { User } from "../../modules/common/user/user.model";

const SYNTHETIC_EMAIL_RE = /^\d{10}@quickbihar\.local$/;

async function main() {
  await mongoose.connect(ENV.MONGODB_URI);
  console.log("Connected to MongoDB");

  const syntheticMatches = await User.updateMany(
    {
      email: SYNTHETIC_EMAIL_RE,
      legacyOtpOnly: { $ne: true },
    },
    { $set: { legacyOtpOnly: true } }
  );

  console.log(
    `Migration 002 complete: synthetic-email users flagged=${syntheticMatches.modifiedCount}`
  );

  const summary = await User.aggregate([
    { $group: { _id: "$legacyOtpOnly", count: { $sum: 1 } } },
  ]);
  console.log("legacyOtpOnly distribution:", summary);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Migration 002 failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});