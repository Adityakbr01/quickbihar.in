import mongoose, { Types } from "mongoose";
import fs from "fs";
import { ENV } from "@/config/env.config";
import { uploadToImageKit } from "@/utils/imagekit.util";
import { User } from "@/modules/common/user/user.model";
import { Mall } from "@/modules/common/mall/mall.model";
import { MallReview } from "@/modules/common/mall/mallReview.model";
import { Seller } from "@/modules/common/seller/seller.model";
import { Store } from "@/modules/common/store/store.model";
import { Product } from "@/modules/clothing/products/product.model";
import { RefundPolicy } from "@/modules/common/refundPolicy/refundPolicy.model";
import { SizeChart } from "@/modules/clothing/sizeChart/sizeChart.model";
import { getMallDetailBySlug } from "@/modules/common/mall/mall.service";

async function uploadLocalImage(
    localPath: string,
    fileName: string,
    folder: string
): Promise<{ url: string; fileId: string }> {
    if (!fs.existsSync(localPath)) {
        throw new Error(`Local file not found: ${localPath}`);
    }
    const buffer = fs.readFileSync(localPath);
    console.log(`Reading ${localPath} (${buffer.length} bytes)...`);
    const uploaded = await uploadToImageKit(buffer, fileName, folder);
    console.log(`Uploaded to ImageKit [${folder}]: ${uploaded.url}`);
    return uploaded;
}

async function main() {
    console.log("=================================================");
    console.log("🚀 CREATING ADITYA FASHION MALL & 7 CATEGORY PRODUCTS");
    console.log("=================================================");

    await mongoose.connect(ENV.MONGODB_URI);
    console.log("Connected to MongoDB Atlas.");

    const sellerUserId = new Types.ObjectId("6a9c2739a9693d1c9e7603da");
    const sellerDoc = await Seller.findOne({ userId: sellerUserId });
    if (!sellerDoc) {
        throw new Error("Seller profile not found for user 6a9c2739a9693d1c9e7603da");
    }
    console.log(`Found Seller: ${sellerDoc.businessName} (ID: ${sellerDoc._id})`);

    const storeDoc = await Store.findOne({ sellerId: sellerUserId });
    if (!storeDoc) {
        throw new Error("Store not found for seller 6a9c2739a9693d1c9e7603da");
    }
    console.log(`Found Store: ${storeDoc.name} (ID: ${storeDoc._id})`);

    const adminUser = await User.findOne({ email: "admin@quickbihar.in" });
    const adminId = adminUser ? adminUser._id : sellerUserId;

    // 1. UPLOAD NANO BANANA AI-GENERATED IMAGES TO IMAGEKIT
    console.log("\n📸 1. Uploading AI-Generated Mall Media to ImageKit...");
    const brainDir = "C:\\Users\\ADITYA\\.gemini\\antigravity-ide\\brain\\e1f93365-9fa7-443f-8df8-481ce0dfb713";
    
    const mallLogoPath = `${brainDir}\\mall_logo_1789051183315.jpg`;
    const mallCoverPath = `${brainDir}\\aditya_mall_cover_1789051367372.jpg`;
    const shirtPath = `${brainDir}\\aditya_mens_shirt_1789051385308.jpg`;
    const tshirtPath = `${brainDir}\\aditya_mens_tshirt_1789051411817.jpg`;
    const sareePath = `${brainDir}\\aditya_banarasi_saree_1789051436743.jpg`;
    const kurtiPath = `${brainDir}\\aditya_kurti_set_1789051459961.jpg`;
    const jeansPath = `${brainDir}\\aditya_denim_jeans_1789051481437.jpg`;
    const kurtaPath = `${brainDir}\\aditya_mens_kurta_1789051501416.jpg`;
    const kidsPath = `${brainDir}\\aditya_kids_festive_1789051521912.jpg`;

    const mallLogo = await uploadLocalImage(mallLogoPath, "aditya_fashion_mall_logo.jpg", "malls/logos");
    const mallCover = await uploadLocalImage(mallCoverPath, "aditya_fashion_mall_cover.jpg", "malls/covers");

    // 2. CREATE OR UPDATE MALL: "Aditya Fashion Mall"
    console.log("\n🏢 2. Creating/Updating 'Aditya Fashion Mall'...");
    const mallSlug = "aditya-fashion-mall";
    const mallData = {
        name: "Aditya Fashion Mall",
        slug: mallSlug,
        description: "Dumraon's premier fashion & lifestyle mall featuring high fashion apparel, ethnic wear, Banarasi sarees, casual wear, and kids collection with instant hyperlocal delivery.",
        address: {
            line1: "NH-84, Bhojpur Kadim",
            city: "Dumraon",
            state: "Bihar",
            pincode: "802133",
            latitude: 25.5941,
            longitude: 85.1376,
        },
        contact: {
            managerName: "ADITYA KBR",
            email: "aditykbr01@gmail.com",
        },
        mobileNumber: "09304922632",
        isMobileVisible: true,
        logoUrl: mallLogo.url,
        logoImagePublicId: mallLogo.fileId,
        coverImageUrl: mallCover.url,
        coverImagePublicId: mallCover.fileId,
        images: [
            { url: mallCover.url, fileId: mallCover.fileId },
            { url: mallLogo.url, fileId: mallLogo.fileId },
        ],
        totalStores: 1,
        rating: 0,
        reviewCount: 0,
        isFeatured: true,
        featuredRank: 1,
        isActive: true,
        status: "APPROVED",
        requestedBy: sellerUserId,
        reviewedBy: adminId,
        reviewedAt: new Date(),
    };

    const mall = await Mall.findOneAndUpdate(
        { slug: mallSlug },
        { $set: mallData },
        { upsert: true, returnDocument: 'after' }
    );
    console.log(`✅ Mall created/updated: ${mall.name} (ID: ${mall._id}, Slug: ${mall.slug})`);

    // 3. LINK SELLER & STORE TO MALL
    console.log("\n🔗 3. Linking Seller & Store to Aditya Fashion Mall...");
    sellerDoc.mallId = mall._id as any;
    sellerDoc.mallUnit = "Showroom #101, Ground Floor";
    sellerDoc.mallFloor = "Ground Floor";
    sellerDoc.mallRequest = {
        mallId: mall._id as any,
        mallUnit: "Showroom #101, Ground Floor",
        mallFloor: "Ground Floor",
        message: "Primary anchor store in Aditya Fashion Mall",
        status: "APPROVED",
        requestedAt: new Date(),
        reviewedBy: adminId as any,
        reviewedAt: new Date(),
    };
    sellerDoc.status = "APPROVED";
    sellerDoc.isVerified = true;
    await sellerDoc.save();
    console.log(`✅ Seller profile linked to Mall ID: ${mall._id}`);

    // Update Store branding
    storeDoc.name = "Aditya Fashion Mall";
    storeDoc.logoUrl = mallLogo.url;
    storeDoc.bannerUrl = mallCover.url;
    storeDoc.storeImages = [mallCover.url];
    storeDoc.isOpen = true;
    storeDoc.isActive = true;
    storeDoc.isVerified = true;
    storeDoc.isSetupComplete = true;
    await storeDoc.save();
    console.log(`✅ Store ${storeDoc.name} updated with active status and branding.`);

    // 5. UPLOAD PRODUCT IMAGES AND SEED PRODUCTS ACROSS 7 CATEGORIES
    console.log("\n🛍️ 5. Uploading Product Images & Seeding 7 Category Products...");

    // Policies
    const returnPolicy = await RefundPolicy.findOne({ policyType: "RETURN" });
    const refundPolicy = await RefundPolicy.findOne({ policyType: "REFUND" });
    const shippingPolicy = await RefundPolicy.findOne({ policyType: "SHIPPING" });
    const termsPolicy = await RefundPolicy.findOne({ policyType: "TERMS" });

    const policyRefs = {
        returnPolicy: returnPolicy?._id,
        refundPolicy: refundPolicy?._id,
        shippingPolicy: shippingPolicy?._id,
        termsPolicy: termsPolicy?._id,
    };

    // Size charts
    const shirtChart = await SizeChart.findOne({ name: /Formal & Casual Shirt/i });
    const tshirtChart = await SizeChart.findOne({ name: /T-Shirt/i });
    const jeansChart = await SizeChart.findOne({ name: /Jeans & Trousers/i });
    const kurtiChart = await SizeChart.findOne({ name: /Kurti & Top/i });

    const productsDef = [
        {
            localPath: shirtPath,
            fileName: "aditya_mens_oxford_shirt.jpg",
            title: "Royal Oxford Pure Cotton Slim Fit Casual Shirt",
            slug: "royal-oxford-pure-cotton-slim-fit-casual-shirt",
            description: "Crafted from 100% long-staple combed cotton, this Oxford button-down shirt offers unmatched breathability and a sharp silhouette. Perfect for formal meetings and casual evenings.",
            shortDescription: "100% Pure Oxford Cotton Slim Fit Shirt",
            brand: "Aditya Classics",
            category: "Shirts & T-Shirts",
            subCategory: "Men's Shirts",
            gender: "Men",
            price: 899,
            originalPrice: 1599,
            discountPercentage: 44,
            sizeChartId: shirtChart?._id,
            variants: [
                { size: "38 (S)", color: "Navy Blue", stock: 15, sku: "SHIRT-NVY-S", price: 899 },
                { size: "40 (M)", color: "Navy Blue", stock: 25, sku: "SHIRT-NVY-M", price: 899 },
                { size: "42 (L)", color: "Navy Blue", stock: 20, sku: "SHIRT-NVY-L", price: 899 },
                { size: "44 (XL)", color: "Navy Blue", stock: 10, sku: "SHIRT-NVY-XL", price: 899 },
            ],
            details: { fit: "Slim Fit", pattern: "Solid", material: "100% Cotton", collar: "Button-Down", sleeve: "Full Sleeve" },
            tags: ["shirt", "cotton", "formal", "casual", "menswear"],
        },
        {
            localPath: tshirtPath,
            fileName: "aditya_mens_supima_tshirt.jpg",
            title: "Supima Cotton Heavyweight Crew Neck Oversized T-Shirt",
            slug: "supima-cotton-heavyweight-crew-neck-tshirt",
            description: "240 GSM pre-shrunk heavyweight Supima cotton tee with double-needle ribbed collar and dropped shoulders. Modern streetwear aesthetic built for all-day comfort.",
            shortDescription: "240 GSM Heavyweight Oversized Crew Tee",
            brand: "Aditya Urban",
            category: "Shirts & T-Shirts",
            subCategory: "Men's T-Shirts",
            gender: "Men",
            price: 599,
            originalPrice: 1199,
            discountPercentage: 50,
            sizeChartId: tshirtChart?._id,
            variants: [
                { size: "S", color: "Olive Green", stock: 15, sku: "TSHIRT-OLV-S", price: 599 },
                { size: "M", color: "Olive Green", stock: 25, sku: "TSHIRT-OLV-M", price: 599 },
                { size: "L", color: "Olive Green", stock: 20, sku: "TSHIRT-OLV-L", price: 599 },
                { size: "XL", color: "Olive Green", stock: 10, sku: "TSHIRT-OLV-XL", price: 599 },
            ],
            details: { fit: "Oversized Fit", pattern: "Solid", material: "100% Supima Cotton", collar: "Crew Neck", sleeve: "Half Sleeve" },
            tags: ["tshirt", "oversized", "streetwear", "supima", "cotton"],
        },
        {
            localPath: sareePath,
            fileName: "aditya_banarasi_silk_saree.jpg",
            title: "Heritage Banarasi Katan Silk Wedding Saree with Pure Zari Border",
            slug: "heritage-banarasi-katan-silk-wedding-saree-pure-zari",
            description: "Traditional hand-woven pure Katan Silk saree from the master weavers of Varanasi. Adorned with floral jaal motifs and an opulent golden zari border and pallu. Includes matching unstitched blouse piece.",
            shortDescription: "Authentic Handloom Katan Silk Wedding Saree with Zari",
            brand: "Aditya Handlooms",
            category: "Sarees",
            subCategory: "Banarasi Silk Sarees",
            gender: "Women",
            price: 2999,
            originalPrice: 5999,
            discountPercentage: 50,
            sizeChartId: undefined,
            variants: [
                { size: "Free Size", color: "Crimson Red & Gold", stock: 20, sku: "SAREE-BAN-RED", price: 2999 },
                { size: "Free Size", color: "Royal Emerald & Gold", stock: 10, sku: "SAREE-BAN-GRN", price: 2999 },
            ],
            details: { fit: "Regular", pattern: "Woven Zari Work", material: "Pure Katan Silk", washCare: "Dry Clean Only" },
            tags: ["saree", "silk", "banarasi", "wedding", "festive", "traditional"],
        },
        {
            localPath: kurtiPath,
            fileName: "aditya_anarkali_kurti_set.jpg",
            title: "Chanderi Floral Anarkali Kurti with Flared Palazzo & Organza Dupatta",
            slug: "chanderi-floral-anarkali-kurti-palazzo-organza-dupatta",
            description: "Step into effortless grace with this 3-piece festive ethnic set. Features delicate gotta patti hand embroidery on the yoke, flared Anarkali silhouette, matching palazzo, and a gossamer organza dupatta.",
            shortDescription: "3-Piece Embroidered Chanderi Kurti & Palazzo Set",
            brand: "Aditya Ethnic",
            category: "Kurtis & Suits",
            subCategory: "Kurtis & Kurta Sets",
            gender: "Women",
            price: 1499,
            originalPrice: 2899,
            discountPercentage: 48,
            sizeChartId: kurtiChart?._id,
            variants: [
                { size: "S", color: "Blush Peach", stock: 10, sku: "KURTI-PCH-S", price: 1499 },
                { size: "M", color: "Blush Peach", stock: 18, sku: "KURTI-PCH-M", price: 1499 },
                { size: "L", color: "Blush Peach", stock: 15, sku: "KURTI-PCH-L", price: 1499 },
                { size: "XL", color: "Blush Peach", stock: 12, sku: "KURTI-PCH-XL", price: 1499 },
            ],
            details: { fit: "Flared Anarkali", pattern: "Floral Embroidery", material: "Chanderi Silk Blend", sleeve: "3/4th Sleeve" },
            tags: ["kurti", "anarkali", "suit-set", "ethnic", "chanderi"],
        },
        {
            localPath: jeansPath,
            fileName: "aditya_mens_indigo_jeans.jpg",
            title: "Indigo Dark Washed Stretchable Slim Fit Denim Jeans",
            slug: "indigo-dark-washed-stretchable-slim-fit-denim-jeans",
            description: "Engineered with 98% cotton and 2% elastane for optimum 4-way stretch and retention. Features subtle whiskers, mid-rise contour waistband, and antique brass hardware.",
            shortDescription: "Premium 4-Way Stretch Indigo Slim Jeans",
            brand: "Aditya Denim",
            category: "Jeans",
            subCategory: "Men's Slim Fit Jeans",
            gender: "Men",
            price: 1099,
            originalPrice: 2199,
            discountPercentage: 50,
            sizeChartId: jeansChart?._id,
            variants: [
                { size: "30", color: "Dark Indigo", stock: 12, sku: "JEANS-IND-30", price: 1099 },
                { size: "32", color: "Dark Indigo", stock: 20, sku: "JEANS-IND-32", price: 1099 },
                { size: "34", color: "Dark Indigo", stock: 18, sku: "JEANS-IND-34", price: 1099 },
                { size: "36", color: "Dark Indigo", stock: 10, sku: "JEANS-IND-36", price: 1099 },
                { size: "38", color: "Dark Indigo", stock: 8, sku: "JEANS-IND-38", price: 1099 },
            ],
            details: { fit: "Slim Fit", pattern: "Clean Whisker Wash", material: "98% Cotton 2% Elastane", washCare: "Machine Wash Cold" },
            tags: ["jeans", "denim", "stretchable", "slim-fit", "indigo"],
        },
        {
            localPath: kurtaPath,
            fileName: "aditya_mens_silk_kurta.jpg",
            title: "Royal Handcrafted Raw Silk Kurta with Embroidered Nehru Jacket",
            slug: "royal-handcrafted-raw-silk-kurta-embroidered-nehru-jacket",
            description: "Regal festive ensemble featuring a pure raw silk full-sleeve kurta paired with an intricately thread-embroidered Mandarin collar Nehru jacket and churidar pajama.",
            shortDescription: "Festive Raw Silk Kurta Set with Embroidered Nehru Jacket",
            brand: "Aditya Heritage",
            category: "Ethnic Wear",
            subCategory: "Men's Kurtas & Ethnic",
            gender: "Men",
            price: 2199,
            originalPrice: 4299,
            discountPercentage: 49,
            sizeChartId: shirtChart?._id,
            variants: [
                { size: "38 (S)", color: "Ivory & Maroon", stock: 8, sku: "KURTA-IVR-38", price: 2199 },
                { size: "40 (M)", color: "Ivory & Maroon", stock: 15, sku: "KURTA-IVR-40", price: 2199 },
                { size: "42 (L)", color: "Ivory & Maroon", stock: 12, sku: "KURTA-IVR-42", price: 2199 },
                { size: "44 (XL)", color: "Ivory & Maroon", stock: 6, sku: "KURTA-IVR-44", price: 2199 },
            ],
            details: { fit: "Tailored Fit", pattern: "Thread Embroidery", material: "Raw Silk Blend", collar: "Mandarin Collar" },
            tags: ["kurta", "ethnic", "nehru-jacket", "wedding", "festive"],
        },
        {
            localPath: kidsPath,
            fileName: "aditya_kids_festive_kurta.jpg",
            title: "Boys Festive Jacquard Silk Kurta Pajama Set with Pocket Square",
            slug: "boys-festive-jacquard-silk-kurta-pajama-set",
            description: "Vibrant and comfortable festive kurta set tailored for boys. Made from gentle, skin-friendly jacquard weave with soft cotton lining, elasticated churidar, and contrast pocket square.",
            shortDescription: "Skin-friendly Jacquard Kurta Pajama for Boys",
            brand: "Aditya Juniors",
            category: "Kids Wear",
            subCategory: "Boys Clothing",
            gender: "Kids",
            price: 799,
            originalPrice: 1499,
            discountPercentage: 47,
            sizeChartId: undefined,
            variants: [
                { size: "2-3Y", color: "Marigold Yellow", stock: 10, sku: "KID-YEL-23", price: 799 },
                { size: "4-5Y", color: "Marigold Yellow", stock: 15, sku: "KID-YEL-45", price: 799 },
                { size: "6-7Y", color: "Marigold Yellow", stock: 12, sku: "KID-YEL-67", price: 799 },
                { size: "8-9Y", color: "Marigold Yellow", stock: 10, sku: "KID-YEL-89", price: 799 },
            ],
            details: { fit: "Comfort Fit", pattern: "Jacquard Weave", material: "Silk Blend with Cotton Lining" },
            tags: ["kids", "boys", "kurta", "festive", "ethnic"],
        },
    ];

    for (const p of productsDef) {
        console.log(`\nProcessing product: ${p.title}`);
        const uploadedImg = await uploadLocalImage(p.localPath, p.fileName, "products");

        const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);

        const productData: any = {
            title: p.title,
            slug: p.slug,
            description: p.description,
            shortDescription: p.shortDescription,
            brand: p.brand,
            category: p.category,
            subCategory: p.subCategory,
            gender: p.gender,
            price: p.price,
            originalPrice: p.originalPrice,
            discountPercentage: p.discountPercentage,
            currency: "INR",
            isGstApplicable: false,
            gstPercentage: 0,
            images: [
                {
                    url: uploadedImg.url,
                    fileId: uploadedImg.fileId,
                },
            ],
            sellerId: sellerUserId,
            storeId: storeDoc._id,
            scope: "GLOBAL",
            variants: p.variants,
            totalStock,
            ratings: { average: 0, count: 0 },
            sizeChartId: p.sizeChartId,
            vertical: "CLOTHING",
            details: p.details,
            tags: p.tags,
            seo: {
                metaTitle: `${p.title} | Aditya Fashion Mall`,
                metaDescription: p.shortDescription,
                keywords: p.tags,
            },
            isFeatured: true,
            isTrending: true,
            isNewArrival: true,
            deliveryInfo: {
                isExpressAvailable: false,
                isCodAvailable: true,
                estimatedDays: 2,
                returnPolicy: "7 days easy return",
            },
            compliance: {
                countryOfOrigin: "India",
                manufacturerDetail: "Aditya Fashion Mall, NH-84, Bhojpur Kadim, Dumraon, Bihar - 802133",
                packerDetail: "Aditya Fashion Mall, NH-84, Bhojpur Kadim, Dumraon, Bihar - 802133",
            },
            logistics: {
                pickupLocation: "Aditya Fashion Mall, NH-84, Bhojpur Kadim, Dumraon, Buxar - 802133",
                warehouseName: "Aditya Dumraon Central",
                latitude: 25.5941,
                longitude: 85.1376,
            },
            policyRefs,
            refundPolicy: policyRefs.returnPolicy,
            isActive: true,
            isDeleted: false,
            approvalStatus: "APPROVED",
        };

        const prod = await Product.findOneAndUpdate(
            { slug: p.slug },
            { $set: productData },
            { upsert: true, new: true }
        );
        console.log(`✔️ Created/Updated product: ${prod.title} (ID: ${prod._id}, Category: ${prod.category})`);
    }

    // 6. VALIDATE MALL DETAIL
    console.log("\n🔍 6. Validating Aditya Fashion Mall Detail & Product Linkage...");
    const detail = await getMallDetailBySlug(mallSlug);
    console.log(`Mall name: ${detail.mall.name}`);
    console.log(`Mall slug: ${detail.mall.slug}`);
    console.log(`Mall sellerCount: ${detail.mall.sellerCount}`);
    console.log(`Mall productCount attached: ${detail.products.length}`);
    console.log(`Mall reviewCount: ${detail.reviews.length}`);
    for (const prod of detail.products) {
        console.log(`  - [${prod.category}] ${prod.title} - ₹${prod.price} (Image: ${prod.image})`);
    }

    console.log("\n=================================================");
    console.log("🎉 ALL OPERATIONS COMPLETED WITH 100% SUCCESS!");
    console.log("=================================================");

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("❌ Execution Error:", err);
    process.exit(1);
});
