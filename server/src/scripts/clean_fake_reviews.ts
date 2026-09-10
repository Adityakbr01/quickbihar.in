import mongoose, { Types } from "mongoose";
import { ENV } from "@/config/env.config";
import { Mall } from "@/modules/common/mall/mall.model";
import { MallReview } from "@/modules/common/mall/mallReview.model";
import { Product } from "@/modules/clothing/products/product.model";
import { Review } from "@/modules/clothing/products/review.model";

async function main() {
    console.log("=================================================");
    console.log("🧹 REMOVING FAKE REVIEWS & RESETTING REAL RATINGS");
    console.log("=================================================");

    await mongoose.connect(ENV.MONGODB_URI);
    console.log("Connected to MongoDB Atlas.");

    // 1. Delete all Mall Reviews (since the 2 seeded reviews were fake)
    const deletedMallReviews = await MallReview.deleteMany({});
    console.log(`Deleted ${deletedMallReviews.deletedCount} fake mall reviews.`);

    // 2. Delete any product reviews in review.model if any exist
    const deletedProductReviews = await Review.deleteMany({});
    console.log(`Deleted ${deletedProductReviews.deletedCount} product reviews.`);

    // 3. Reset Mall rating and reviewCount to 0
    const updatedMalls = await Mall.updateMany(
        {},
        { $set: { rating: 0, reviewCount: 0 } }
    );
    console.log(`Reset rating & reviewCount on ${updatedMalls.modifiedCount} malls to 0.`);

    // 4. Reset Product ratings to 0 average and 0 count
    const updatedProducts = await Product.updateMany(
        {},
        { $set: { "ratings.average": 0, "ratings.count": 0 } }
    );
    console.log(`Reset ratings on ${updatedProducts.modifiedCount} products to 0.`);

    // Verify
    const mall = await Mall.findOne();
    console.log(`Sample Mall (${mall?.name}): rating=${mall?.rating}, reviewCount=${mall?.reviewCount}`);

    const sampleProduct = await Product.findOne();
    console.log(`Sample Product (${sampleProduct?.title}): ratings=`, sampleProduct?.ratings);

    console.log("=================================================");
    console.log("✅ DATABASE CLEANED: ONLY REAL REVIEWS WILL APPEAR");
    console.log("=================================================");

    await mongoose.disconnect();
}

main().catch(console.error);
