import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

const TOP_8_CONFIG: Record<string, { homePosition: number; isVisibleOnHome: boolean }> = {
  "mens-wear": { homePosition: 1, isVisibleOnHome: true },
  "womens-wear": { homePosition: 2, isVisibleOnHome: true },
  "kids-wear": { homePosition: 3, isVisibleOnHome: true },
  "sarees": { homePosition: 4, isVisibleOnHome: true },
  "jeans": { homePosition: 5, isVisibleOnHome: true },
  "kurtis-suits": { homePosition: 6, isVisibleOnHome: true },
  "shirts-t-shirts": { homePosition: 7, isVisibleOnHome: true },
  "ethnic-wear": { homePosition: 8, isVisibleOnHome: true },
};

async function main() {
  console.log("──────────────────────────────────────────────────");
  console.log("QuickBihar — Configuring Home Category Positions & Visibility");
  console.log("──────────────────────────────────────────────────");

  console.log("Connecting to MongoDB Atlas directly...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB successfully.");

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("No database connection");
  }

  const collection = db.collection("categories");
  const allCategories = await collection.find({}).toArray();
  console.log(`Found ${allCategories.length} total categories in database.\n`);

  for (const cat of allCategories) {
    const slug = (cat.slug || "").toLowerCase();
    const config = TOP_8_CONFIG[slug];

    if (config) {
      await collection.updateOne(
        { _id: cat._id },
        {
          $set: {
            homePosition: config.homePosition,
            isVisibleOnHome: config.isVisibleOnHome,
          },
        }
      );
      console.log(`[TOP-CONFIG] "${cat.title}" (${slug}) -> homePosition: ${config.homePosition}, isVisibleOnHome: ${config.isVisibleOnHome}`);
    } else {
      // If it's a subcategory (has parentId) or other category, set homePosition: 0, isVisibleOnHome: false
      const isSub = !!cat.parentId;
      await collection.updateOne(
        { _id: cat._id },
        {
          $set: {
            homePosition: 0,
            isVisibleOnHome: false,
          },
        }
      );
      console.log(`[OTHER/SUB]  "${cat.title}" (${slug}) [parentId: ${cat.parentId || "none"}] -> homePosition: 0, isVisibleOnHome: false`);
    }
  }

  console.log("\n──────────────────────────────────────────────────");
  console.log("Verification — Top Categories for Home Screen:");
  console.log("──────────────────────────────────────────────────");
  const homeCategories = await collection
    .find({ isVisibleOnHome: true, isActive: true })
    .sort({ homePosition: 1, priority: -1 })
    .toArray();

  for (const c of homeCategories) {
    console.log(` # ${c.homePosition} | ${c.title} (slug: ${c.slug}, parentId: ${c.parentId || "root"})`);
  }

  console.log(`\nTotal categories configured for Home: ${homeCategories.length}`);
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. Done!");
}

main().catch((err) => {
  console.error("Error configuring home categories:", err);
  process.exit(1);
});
