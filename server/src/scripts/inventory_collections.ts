/**
 * READ-ONLY database inventory: lists every collection with its document
 * count. Never writes. Run with: bun run src/scripts/inventory_collections.ts
 */
import mongoose from "mongoose";
import { ENV } from "@/config/env.config";

const uri: string = (ENV as any).MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing");
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db!;
console.log(`database: ${db.databaseName}`);

const cols = await db.listCollections().toArray();
cols.sort((a, b) => a.name.localeCompare(b.name));
for (const c of cols) {
  const count = await db.collection(c.name).estimatedDocumentCount();
  console.log(`${c.name}: ${count}`);
}

await mongoose.disconnect();
