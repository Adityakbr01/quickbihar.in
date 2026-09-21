/**
 * ONE-SHOT cleanup: backs up then empties the order-pipeline collections so
 * testing can start from scratch. USERS, PRODUCTS and everything else are
 * never touched — the script asserts their counts are unchanged afterwards.
 *
 * Approved collections: orders, suborders, fulfillmentevents,
 * notificationoutboxes, notificationtracks, notificationreads,
 * notifications, rideroffers, sellerearnings, sellernotifications.
 *
 * Run with: bun run src/scripts/clean_order_data.ts
 */
import mongoose from "mongoose";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ENV } from "@/config/env.config";

const TARGETS = [
  "orders",
  "suborders",
  "fulfillmentevents",
  "notificationoutboxes",
  "notificationtracks",
  "notificationreads",
  "notifications",
  "rideroffers",
  "sellerearnings",
  "sellernotifications",
];

// Collections that must be byte-identical in count before/after.
const PROTECTED = ["users", "products"];

const uri: string = (ENV as any).MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing");
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db!;
console.log(`database: ${db.databaseName}`);

const beforeProtected = new Map<string, number>();
for (const name of PROTECTED) {
  beforeProtected.set(name, await db.collection(name).estimatedDocumentCount());
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(process.cwd(), "backups", `order-cleanup-${stamp}`);
mkdirSync(backupDir, { recursive: true });

for (const name of TARGETS) {
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) {
    console.log(`${name}: collection missing, skipped`);
    continue;
  }
  const docs = await db.collection(name).find({}).toArray();
  writeFileSync(join(backupDir, `${name}.json`), JSON.stringify(docs, null, 1));
  const res = await db.collection(name).deleteMany({});
  const left = await db.collection(name).estimatedDocumentCount();
  console.log(`${name}: backed up ${docs.length}, deleted ${res.deletedCount}, remaining ${left}`);
}

let ok = true;
for (const name of PROTECTED) {
  const after = await db.collection(name).estimatedDocumentCount();
  const same = after === beforeProtected.get(name);
  if (!same) ok = false;
  console.log(`protected ${name}: before=${beforeProtected.get(name)} after=${after} ${same ? "OK" : "MISMATCH!"}`);
}

console.log(`backup dir: ${backupDir}`);
console.log(ok ? "DONE — protected collections untouched." : "ABORT: protected count changed!");

await mongoose.disconnect();
if (!ok) process.exit(1);
