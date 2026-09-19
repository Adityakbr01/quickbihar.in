/**
 * Jewelry catalog seed — idempotent.
 *
 * Creates/updates the JEWELERY category tree (parent + children) with
 * vertical=JEWELERY so storefront queries (?vertical=JEWELERY) and the
 * mobile Jewelery module resolve categories correctly.
 *
 * Usage:
 *   bun run src/seed/seedJewelry.ts --image https://<cdn>/jewellery.jpg
 *   # or: JEWELRY_CATEGORY_IMAGE=https://... bun run src/seed/seedJewelry.ts
 *
 * An image URL is required because Category.image is mandatory; replace it
 * later per-category from dash-web (product images upload separately).
 */

import mongoose from "mongoose";
import { Category } from "../modules/common/category/category.model";
import { ENV } from "../config/env.config";

const CHILDREN = [
    { title: "Necklace", description: "Pendant necklaces, chains and chokers" },
    { title: "Ring", description: "Rings for daily wear, gifting and bridal" },
    { title: "Earrings", description: "Jhumkas, studs, hoops and drops" },
    { title: "Bangle", description: "Bangles, bracelets and cuffs" },
    { title: "Pendant", description: "Standalone pendants" },
    { title: "Bridal Set", description: "Complete bridal jewellery sets" },
    { title: "Chain", description: "Gold chains for men and women" },
] as const;

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function main() {
    const flagIdx = process.argv.indexOf("--image");
    const image = process.env.JEWELRY_CATEGORY_IMAGE || (flagIdx >= 0 ? process.argv[flagIdx + 1] : "") || "";
    if (!image || image.startsWith("--")) {
        console.error("❌ Provide a category image URL: bun run src/seed/seedJewelry.ts --image https://<cdn>/jewellery.jpg");
        process.exit(1);
    }

    await mongoose.connect(ENV.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const parentSlug = slugify("Jewellery");
    const parent = await Category.findOneAndUpdate(
        { slug: parentSlug },
        {
            $set: {
                title: "Jewellery",
                slug: parentSlug,
                image,
                imagePublicId: "url_provided",
                description: "Hallmarked gold, diamond and polki jewellery",
                vertical: "JEWELERY",
                isActive: true,
                isVisibleOnHome: true,
            },
            $setOnInsert: { priority: 10 },
        },
        { upsert: true, new: true },
    );
    console.log(`✔ Parent category: ${parent.title} (${parent.slug}) vertical=${parent.vertical}`);

    for (const [index, child] of CHILDREN.entries()) {
        const slug = slugify(child.title);
        const doc = await Category.findOneAndUpdate(
            { slug },
            {
                $set: {
                    title: child.title,
                    slug,
                    image,
                    imagePublicId: "url_provided",
                    description: child.description,
                    parentId: parent._id,
                    vertical: "JEWELERY",
                    isActive: true,
                    isVisibleOnHome: true,
                },
                $setOnInsert: { priority: 20 + index },
            },
            { upsert: true, new: true },
        );
        console.log(`✔ Child category: ${doc.title} (${doc.slug}) vertical=${doc.vertical}`);
    }

    // Heal legacy jewelry-named categories created before vertical existed.
    const healed = await Category.updateMany(
        {
            vertical: { $ne: "JEWELERY" },
            $or: [
                { title: { $regex: /jewel|necklace|ring|earring|pendant|bangle|jhumka/i } },
                { slug: { $regex: /jewel|necklace|ring|earring|pendant|bangle|jhumka/i } },
            ],
        },
        { $set: { vertical: "JEWELERY" } },
    );
    console.log(`✔ Healed ${(healed as any).modifiedCount ?? 0} legacy categories to JEWELERY`);

    await mongoose.disconnect();
    console.log("✅ Jewelry category seed complete");
}

main().catch((err) => {
    console.error("❌ Jewelry seed failed:", err?.message || err);
    process.exit(1);
});
