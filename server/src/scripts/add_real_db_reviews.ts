import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { ENV } from "@/config/env.config";
import { User } from "@/modules/common/user/user.model";
import { Role } from "@/modules/common/rbac/rbac.model";
import { Mall } from "@/modules/common/mall/mall.model";
import { MallReview } from "@/modules/common/mall/mallReview.model";
import { Product } from "@/modules/clothing/products/product.model";
import { Review } from "@/modules/clothing/products/review.model";

async function updateProductRatingStats(productId: Types.ObjectId | string) {
    const stats = await Review.aggregate([
        { $match: { productId: new Types.ObjectId(productId.toString()), status: "APPROVED" } },
        {
            $group: {
                _id: "$productId",
                averageRating: { $avg: "$rating" },
                totalCount: { $sum: 1 },
            },
        },
    ]);

    if (stats.length > 0) {
        const average = Number(stats[0].averageRating.toFixed(1));
        const count = stats[0].totalCount;
        await Product.findByIdAndUpdate(productId, {
            $set: {
                "ratings.average": average,
                "ratings.count": count,
            },
        });
        return { average, count };
    } else {
        await Product.findByIdAndUpdate(productId, {
            $set: {
                "ratings.average": 0,
                "ratings.count": 0,
            },
        });
        return { average: 0, count: 0 };
    }
}

async function updateMallRatingStats(mallId: Types.ObjectId | string) {
    const mallObjectId = new Types.ObjectId(mallId.toString());
    const stats = await MallReview.aggregate([
        { $match: { mallId: mallObjectId } },
        {
            $group: {
                _id: "$mallId",
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 },
            },
        },
    ]);

    const nextStats = stats[0];
    const rating = nextStats ? Number(nextStats.averageRating.toFixed(1)) : 0;
    const reviewCount = nextStats?.reviewCount || 0;

    await Mall.findByIdAndUpdate(mallObjectId, {
        $set: { rating, reviewCount },
    });

    return { rating, reviewCount };
}

async function main() {
    console.log("=================================================");
    console.log("📝 SEEDING REAL DATABASE REVIEWS FOR MALL & PRODUCTS");
    console.log("=================================================");

    await mongoose.connect(ENV.MONGODB_URI);
    console.log("Connected to MongoDB Atlas.");

    // 1. Ensure Verified Customer Accounts in User DB
    const userRole = await Role.findOne({ name: "USER" });
    const userRoleId = userRole ? userRole._id : undefined;
    const defaultPassword = await bcrypt.hash("User12345@", 10);

    const customersToEnsure = [
        {
            email: "rohan.sharma.dumraon@gmail.com",
            username: "rohan_sharma_bihar",
            fullName: "Rohan Sharma",
            phone: "09835012345",
        },
        {
            email: "pooja.singh.buxar@gmail.com",
            username: "pooja_singh_buxar",
            fullName: "Pooja Singh",
            phone: "09835012346",
        },
        {
            email: "aniket.tiwari.bihar@gmail.com",
            username: "aniket_tiwari_qb",
            fullName: "Aniket Tiwari",
            phone: "09835012347",
        },
    ];

    const customerUserDocs: any[] = [];
    for (const c of customersToEnsure) {
        let u = await User.findOne({ email: c.email });
        if (!u) {
            u = await User.create({
                ...c,
                password: defaultPassword,
                roleId: userRoleId,
                isVerified: true,
                isBlocked: false,
            });
            console.log(`Created verified buyer user: ${u.fullName} (${u.email})`);
        } else {
            console.log(`Found existing buyer user: ${u.fullName} (${u.email})`);
        }
        customerUserDocs.push(u);
    }

    // Also include existing customer users from DB
    const existingDevDojo = await User.findOne({ email: "adityasdevdojo@gmail.com" });
    if (existingDevDojo) customerUserDocs.push(existingDevDojo);

    const existingAdityaKbr = await User.findOne({ email: "kbraditya405@gmail.com" });
    if (existingAdityaKbr) customerUserDocs.push(existingAdityaKbr);

    console.log(`Available reviewing customers: ${customerUserDocs.length}`);

    // 2. Locate Aditya Fashion Mall
    const mall = await Mall.findOne({ slug: "aditya-fashion-mall" });
    if (!mall) {
        throw new Error("Aditya Fashion Mall not found in DB");
    }
    console.log(`Found Mall: ${mall.name} (ID: ${mall._id})`);

    // 3. Seed Real Mall Reviews (stored in MallReview collection)
    console.log("\n🏢 3. Creating Real Mall Reviews from DB Users...");
    await MallReview.deleteMany({ mallId: mall._id });

    const mallReviewsData = [
        {
            user: customerUserDocs[0],
            rating: 5,
            comment: "Dumraon mein itna shandar mall khulne se bohot suvidha ho gayi hai. NH-84 par location kaafi convenient hai, parking space achhi hai aur ethnic wear ka collection lajawab hai!",
        },
        {
            user: customerUserDocs[1],
            rating: 5,
            comment: "Visited with family yesterday. Best place in Buxar district for authentic Banarasi sarees and branded shirts. Staff is polite, trial rooms are clean and billing was smooth.",
        },
        {
            user: customerUserDocs[2],
            rating: 4,
            comment: "Great experience shopping here! Clean air-conditioned showrooms, wide range of options for kids and men. Instant delivery in Dumraon works seamlessly.",
        },
    ];

    for (const rev of mallReviewsData) {
        if (!rev.user) continue;
        await MallReview.findOneAndUpdate(
            { mallId: mall._id, userId: rev.user._id },
            {
                $set: {
                    mallId: mall._id,
                    userId: rev.user._id,
                    rating: rev.rating,
                    comment: rev.comment,
                },
            },
            { upsert: true, returnDocument: "after" }
        );
        console.log(`  ✔️ Mall Review by ${rev.user.fullName} (${rev.rating}★): "${rev.comment.slice(0, 50)}..."`);
    }

    // Recompute Mall rating stats
    const mallStats = await updateMallRatingStats(mall._id);
    console.log(`✅ Mall aggregated rating updated: ${mallStats.rating}★ (${mallStats.reviewCount} real reviews)`);

    // 4. Seed Real Product Reviews (stored in Review collection)
    console.log("\n🛍️ 4. Creating Real Product Reviews from DB Users...");
    await Review.deleteMany({});

    const products = await Product.find({ isDeleted: false });
    console.log(`Found ${products.length} products to review.`);

    const productReviewTemplates: Record<string, Array<{ userIdx: number; rating: number; title: string; comment: string }>> = {
        "royal-oxford-pure-cotton-slim-fit-casual-shirt": [
            {
                userIdx: 0,
                rating: 5,
                title: "Top-notch Oxford Cotton Fabric",
                comment: "Fabric quality is pure Oxford cotton, super comfortable even in warm weather. Fits true to size chart, collar stays crisp after wash. Highly recommended for formal meetings and dinner outings.",
            },
            {
                userIdx: 2,
                rating: 5,
                title: "Perfect Fitting & Stitching",
                comment: "Stitching around shoulders and cuffs is immaculate. Navy blue color is deep and doesn't bleed. Very fast delivery in Dumraon!",
            },
        ],
        "supima-cotton-heavyweight-crew-neck-tshirt": [
            {
                userIdx: 1,
                rating: 5,
                title: "Heavyweight & Luxurious Feel",
                comment: "240 GSM Supima cotton feels so soft and premium! The ribbed neck doesn't stretch out and the relaxed drop-shoulder cut gives an amazing modern streetwear look.",
            },
            {
                userIdx: 3,
                rating: 4,
                title: "Great Everyday T-Shirt",
                comment: "High quality breathable cotton. Color sage green looks identical to the photos. True value for money.",
            },
        ],
        "heritage-banarasi-katan-silk-wedding-saree-pure-zari": [
            {
                userIdx: 1,
                rating: 5,
                title: "Breathtaking Traditional Handloom Saree",
                comment: "Ordered this Banarasi saree for my family wedding function. The golden zari floral work and rich crimson silk pallu look absolutely royal in person. Unstitched blouse piece is of generous length.",
            },
            {
                userIdx: 0,
                rating: 5,
                title: "Pure Katan Silk Elegance",
                comment: "Drapes beautifully and stays in place comfortably. Pure katan silk sheen is authentic and luxurious.",
            },
        ],
        "chanderi-floral-anarkali-kurti-palazzo-organza-dupatta": [
            {
                userIdx: 1,
                rating: 5,
                title: "Elegant 3-Piece Festive Set",
                comment: "Delicate gotta patti hand embroidery on the yoke and the flared Anarkali silhouette look very graceful. The sheer organza dupatta adds the perfect touch of elegance.",
            },
            {
                userIdx: 2,
                rating: 5,
                title: "Comfortable and Beautiful Color",
                comment: "Blush peach color is subtle and photogenic. Palazzo is roomy and fabric is breathable all day long.",
            },
        ],
        "indigo-dark-washed-stretchable-slim-fit-denim-jeans": [
            {
                userIdx: 0,
                rating: 5,
                title: "Outstanding 4-Way Stretch Comfort",
                comment: "Great stretchable denim jeans. Doesn't feel restrictive when riding bike or sitting for hours. The subtle whisker wash looks very classy.",
            },
            {
                userIdx: 2,
                rating: 4,
                title: "Solid Build & Pocket Quality",
                comment: "Deep pockets, sturdy brass zipper, and clean hem finish. Fitting is slim without being tight.",
            },
        ],
        "royal-handcrafted-raw-silk-kurta-embroidered-nehru-jacket": [
            {
                userIdx: 2,
                rating: 5,
                title: "Royal Outfit for Festive Ceremonies",
                comment: "Raw silk kurta paired with the embroidered maroon Nehru jacket makes for a regal wedding attire. Got compliments from everyone at the puja. Fit around chest and shoulders was spot on.",
            },
            {
                userIdx: 3,
                rating: 5,
                title: "Exceptional Embroidery Work",
                comment: "Thread work on the jacket collar and front panels is very neat. Excellent packaging and delivery by QuickBihar.",
            },
        ],
        "boys-festive-jacquard-silk-kurta-pajama-set": [
            {
                userIdx: 1,
                rating: 5,
                title: "Gentle on Kid's Skin",
                comment: "Soft inner cotton lining prevents any itching from the jacquard weave. My 5-year-old son wore it happily throughout the celebration. Looks very cute and vibrant in photos!",
            },
            {
                userIdx: 0,
                rating: 5,
                title: "Bright Festive Yellow Color",
                comment: "Elasticated churidar pajama is hassle-free for kids. Fabric is high quality and washes easily.",
            },
        ],
    };

    for (const prod of products) {
        const templates = productReviewTemplates[prod.slug];
        if (templates && templates.length > 0) {
            for (const t of templates) {
                const user = customerUserDocs[t.userIdx % customerUserDocs.length]!;
                await Review.create({
                    productId: prod._id,
                    userId: user._id,
                    rating: t.rating,
                    title: t.title,
                    comment: t.comment,
                    isVerifiedBuyer: true,
                    status: "APPROVED",
                });
                console.log(`  ✔️ Product Review on '${prod.title.slice(0, 30)}...' by ${user.fullName} (${t.rating}★)`);
            }
        }

        // Recompute aggregate ratings for this product
        const prodStats = await updateProductRatingStats(prod._id);
        console.log(`  📊 Aggregated '${prod.title.slice(0, 25)}...': rating=${prodStats.average}★, count=${prodStats.count}`);
    }

    console.log("\n=================================================");
    console.log("🎉 REAL REVIEWS & RATINGS SEEDED & AGGREGATED 100%!");
    console.log("=================================================");

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
