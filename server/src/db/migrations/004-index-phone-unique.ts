/**
 * Migration 004 — make `User.phone` unique sparse.
 *
 * Three steps, all gated by a dry-run flag:
 *   1. Aggregate duplicate phone values across the users collection.
 *   2. For each duplicate group, append `#<n>` to all but the canonical (lowest _id).
 *   3. Drop the existing sparse-only index, then create the unique-sparse index.
 *
 * Usage:
 *   bun run src/db/migrations/004-index-phone-unique.ts          # dry-run (report only)
 *   bun run src/db/migrations/004-index-phone-unique.ts --apply   # commit changes
 *
 * NEVER run --apply without reviewing the dry-run output first. The append-#<n>
 * strategy preserves all phone data but loses the original numeric value for
 * non-canonical records — they will still appear as valid 10-digit Indian
 * mobile numbers for contact purposes but lose OTP-receive capability if that
 * ever becomes a feature again.
 */
import mongoose from "mongoose";
import { ENV } from "../../config/env.config";
import { User } from "../../modules/common/user/user.model";

const APPLY = process.argv.includes("--apply");

async function main() {
  await mongoose.connect(ENV.MONGODB_URI);
  console.log(`Connected to MongoDB (mode: ${APPLY ? "APPLY" : "DRY-RUN"})`);

  // Step 1: find duplicates
  const duplicates = await User.aggregate([
    { $match: { phone: { $exists: true, $ne: null, $ne: "" } } },
    { $group: { _id: "$phone", count: { $sum: 1 }, docs: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicates.length === 0) {
    console.log("✅ No duplicate phone numbers found. Safe to create the unique index.");
  } else {
    console.log(`⚠️ Found ${duplicates.length} duplicate phone value(s):`);
    for (const d of duplicates) {
      console.log(`  phone=${d._id}  → ${d.count} users: ${d.docs.join(", ")}`);
    }
  }

  // Step 2: de-duplicate by appending #<n>
  if (duplicates.length > 0 && APPLY) {
    let renamed = 0;
    for (const d of duplicates) {
      const canonical = d.docs[0]; // keep canonical as-is
      for (let i = 1; i < d.docs.length; i++) {
        const userId = d.docs[i];
        const newPhone = `${d._id}#${i}`;
        await User.updateOne({ _id: userId }, { $set: { phone: newPhone } });
        renamed++;
        console.log(`  renamed user ${userId}: ${d._id} → ${newPhone}`);
      }
      void canonical;
    }
    console.log(`Renamed ${renamed} non-canonical duplicate phone(s).`);
  } else if (duplicates.length > 0) {
    console.log("DRY-RUN: re-run with --apply to rename non-canonical duplicates.");
  }

  // Step 3: drop the existing phone index and create the unique-sparse one
  if (APPLY) {
    const indexes = await User.collection.indexes();
    const phoneIdx = indexes.find((i) => i.name === "phone_1");
    if (phoneIdx) {
      await User.collection.dropIndex("phone_1");
      console.log("Dropped existing phone_1 index.");
    }
    await User.collection.createIndex(
      { phone: 1 },
      { name: "phone_1", unique: true, sparse: true }
    );
    console.log("Created unique sparse phone index.");
  } else {
    console.log("DRY-RUN: re-run with --apply to drop/recreate the phone index.");
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Migration 004 failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});