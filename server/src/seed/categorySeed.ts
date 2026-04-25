import mongoose from "mongoose";
import { Category, CategoryAttribute } from "../modules/category/category.model";
import { CATEGORY_TREE } from "../modules/category/category.constants";
import { CATEGORY_ATTRIBUTE_MAP } from "../modules/category/attribute.constants";
import { ENV } from "../config/env.config";

const connectDB = async () => {
    try {
        await mongoose.connect(ENV.MONGODB_URI);
        console.log("🔥 MongoDB Connected for Seeding Categories");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

const insertCategoryTree = async (categories: any[], parentId: string | null = null, level: number = 0) => {
    for (const cat of categories) {
        // Create category
        const newCat = await Category.create({
            name: cat.name,
            slug: cat.slug,
            parentId,
            level,
            image: `https://dummyimage.com/200x200/000/fff&text=${cat.slug}`,
            imagePublicId: `dummy_img_${cat.slug}`
        });

        // Add attributes if exist in map
        const attributes = CATEGORY_ATTRIBUTE_MAP[cat.slug];
        if (attributes && attributes.length > 0) {
            const attributesData = attributes.map(attr => ({
                ...attr,
                categoryId: newCat._id
            }));
            await CategoryAttribute.insertMany(attributesData);
            console.log(`✅ Attributes added for ${cat.name}`);
        }

        // Recursively add children
        if (cat.children && cat.children.length > 0) {
            await insertCategoryTree(cat.children, newCat._id as unknown as string, level + 1);
        }
    }
};

const seedCategories = async () => {
    await connectDB();

    try {
        console.log("🗑️ Clearing existing categories and attributes...");
        await Category.deleteMany({});
        await CategoryAttribute.deleteMany({});
        try {
            await Category.collection.dropIndexes();
            await CategoryAttribute.collection.dropIndexes();
        } catch (e) {
            console.log("No indexes to drop or index drop failed");
        }

        console.log("🌱 Seeding Category Tree...");
        await insertCategoryTree(CATEGORY_TREE);

        console.log("✨ Seeding Completed Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seedCategories();
