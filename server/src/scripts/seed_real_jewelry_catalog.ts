import mongoose, { Types } from "mongoose";
import fs from "fs";
import path from "path";
import { ENV } from "../config/env.config";
import { uploadToImageKit } from "../utils/imagekit.util";
import { User } from "../modules/common/user/user.model";
import { Store } from "../modules/common/store/store.model";
import { Product } from "../modules/clothing/products/product.model";
import { Category } from "../modules/common/category/category.model";
import { RefundPolicy } from "../modules/common/refundPolicy/refundPolicy.model";

const BRAIN_DIR = "C:\\Users\\ADITYA\\.gemini\\antigravity-ide\\brain\\bf7128e6-ec9f-4939-b7a6-35202d5c542d";

async function uploadLocalImage(
    localFilename: string,
    targetName: string,
    folder: string
): Promise<{ url: string; fileId: string }> {
    const fullPath = path.join(BRAIN_DIR, localFilename);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }
    const buffer = fs.readFileSync(fullPath);
    console.log(`📤 Uploading ${localFilename} (${(buffer.length / 1024).toFixed(1)} KB) -> ImageKit/${folder}...`);
    const uploaded = await uploadToImageKit(buffer, targetName, folder);
    console.log(`   ✅ Success: ${uploaded.url}`);
    return uploaded;
}

async function main() {
    console.log("=================================================");
    console.log("💎 SEEDING REAL JEWELRY CATALOG & REPLACING MOCKS");
    console.log("=================================================");

    await mongoose.connect(ENV.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    // 1. Identify Seller & Store
    const sellerEmail = "aditykbr01@gmail.com";
    const sellerUser = await User.findOne({ email: sellerEmail });
    if (!sellerUser) {
        throw new Error(`Seller with email ${sellerEmail} not found`);
    }
    console.log(`Found Seller User: ${sellerUser.email} (ID: ${sellerUser._id})`);

    const storeDoc = await Store.findOne({ sellerId: sellerUser._id });
    if (!storeDoc) {
        throw new Error(`Store for seller ${sellerUser._id} not found`);
    }
    console.log(`Found Store: ${storeDoc.name} (ID: ${storeDoc._id})`);

    // 2. Fetch Policies
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

    // 3. Locate Generated Images in Brain Directory
    const brainFiles = fs.readdirSync(BRAIN_DIR);
    const findFile = (prefix: string) => {
        const found = brainFiles.find((f) => f.startsWith(prefix) && f.endsWith(".jpg"));
        if (!found) throw new Error(`Could not find generated image with prefix '${prefix}' in ${BRAIN_DIR}`);
        return found;
    };

    const pendantFile = findFile("pendant_necklace_");
    const banglesFile = findFile("gold_bangles_");
    const ringFile = findFile("diamond_ring_");
    const jhumkasFile = findFile("temple_jhumkas_");
    const bridalFile = findFile("bridal_set_");
    const coinFile = findFile("coin_pendant_");
    const chainFile = findFile("gold_chain_");
    const showcaseFile = findFile("jewelry_showcase_");

    console.log("\n📸 Uploading 8 High-Resolution AI Images to ImageKit...");
    const imgPendant = await uploadLocalImage(pendantFile, "jewelry_pear_ruby_pendant.jpg", "products/jewelry");
    const imgBangles = await uploadLocalImage(banglesFile, "jewelry_royal_gold_bangles.jpg", "products/jewelry");
    const imgRing = await uploadLocalImage(ringFile, "jewelry_solitaire_diamond_ring.jpg", "products/jewelry");
    const imgJhumkas = await uploadLocalImage(jhumkasFile, "jewelry_peacock_temple_jhumkas.jpg", "products/jewelry");
    const imgBridal = await uploadLocalImage(bridalFile, "jewelry_royal_kundan_bridal_set.jpg", "products/jewelry");
    const imgCoin = await uploadLocalImage(coinFile, "jewelry_laxmi_temple_coin_pendant.jpg", "products/jewelry");
    const imgChain = await uploadLocalImage(chainFile, "jewelry_solid_gold_curb_chain.jpg", "products/jewelry");
    const imgShowcase = await uploadLocalImage(showcaseFile, "jewelry_collection_showcase.jpg", "categories/jewelry");

    // 4. Update the 2 Existing Products (replace mock data)
    console.log("\n🔄 4. Updating 2 existing jewelry products (replacing mocks)...");

    // Product 1: Mira Gold Pendant Necklace (6aae364ce420ec4277923ff6)
    const p1 = await Product.findByIdAndUpdate(
        "6aae364ce420ec4277923ff6",
        {
            $set: {
                title: "Mira 22K Yellow Gold Pear Ruby & Diamond Pendant Necklace",
                slug: "mira-22k-gold-pear-ruby-diamond-pendant-necklace",
                brand: "QuickBihar Jewels",
                category: "Jewellery",
                subCategory: "Necklace",
                gender: "Women",
                price: 34500,
                originalPrice: 39900,
                discountPercentage: 14,
                currency: "INR",
                isGstApplicable: false,
                gstPercentage: 0,
                description:
                    "An exquisite hallmarked 22K yellow gold pendant necklace featuring a certified natural pear-shaped crimson ruby enveloped in a halo of sparkling micro-pave diamonds. Suspended from an elegant twisted curb chain. Perfect for celebratory occasions, weddings, and formal evenings.",
                shortDescription: "Certified 22K Gold Pendant with Natural Ruby & Micro Diamonds",
                images: [
                    {
                        url: imgPendant.url,
                        fileId: imgPendant.fileId,
                    },
                ],
                sellerId: sellerUser._id,
                storeId: storeDoc._id,
                scope: "GLOBAL",
                variants: [
                    {
                        size: "18 Inch",
                        color: "22K Yellow Gold",
                        stock: 12,
                        sku: "QBJ-NK-RUBY-01",
                        price: 34500,
                    },
                ],
                totalStock: 12,
                vertical: "JEWELERY",
                jeweleryDetails: {
                    metalType: "22K Yellow Gold",
                    purity: "22K",
                    hallmark: true,
                    bisMark: "HUID-QB84920",
                    gemstone: "Natural Burmese Ruby & Diamond",
                    stoneWeightCt: 1.85,
                    weightGrams: 5.4,
                    makingCharge: 3200,
                    wastagePct: 6,
                    certNo: "BIS-QB-2026-0911",
                },
                tags: ["gold", "necklace", "ruby", "diamond", "pendant", "hallmarked", "luxury"],
                seo: {
                    metaTitle: "Mira 22K Gold Pear Ruby & Diamond Pendant Necklace | QuickBihar Jewels",
                    metaDescription: "Buy hallmarked 22K yellow gold pear ruby pendant necklace online on QuickBihar.",
                    keywords: ["gold necklace", "ruby pendant", "22k gold", "quickbihar jewellery"],
                },
                isFeatured: true,
                isTrending: true,
                isNewArrival: false,
                deliveryInfo: {
                    isExpressAvailable: false,
                    isCodAvailable: true,
                    estimatedDays: 3,
                    returnPolicy: "7 days easy return",
                },
                compliance: {
                    countryOfOrigin: "India",
                    manufacturerDetail: "QuickBihar Jewels, Dumraon, Bihar - 802133",
                    packerDetail: "QuickBihar Jewels, Dumraon, Bihar - 802133",
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
            },
        },
        { new: true }
    );
    console.log(`   ✔️ Updated Product 1: ${p1?.title} (${p1?._id})`);

    // Product 2: Seller Panel Gold Bangle (6aae3d6ae863ea797c62271c)
    const p2 = await Product.findByIdAndUpdate(
        "6aae3d6ae863ea797c62271c",
        {
            $set: {
                title: "Kalyani 22K Royal Gold Handcrafted Filigree Bangles (Pair)",
                slug: "kalyani-22k-royal-gold-handcrafted-filigree-bangles-pair",
                brand: "QuickBihar Jewels",
                category: "Jewellery",
                subCategory: "Bangle",
                gender: "Women",
                price: 168000,
                originalPrice: 185000,
                discountPercentage: 9,
                currency: "INR",
                isGstApplicable: false,
                gstPercentage: 0,
                description:
                    "Opulent pair of 22K yellow gold bridal kangan bangles, masterfully handcrafted with intricate openwork floral filigree patterns and antique lotus embossing. Equipped with a secure screw-pin lock mechanism. BIS hallmarked with laser HUID.",
                shortDescription: "Handcrafted 22K Yellow Gold Filigree Bridal Bangles Pair",
                images: [
                    {
                        url: imgBangles.url,
                        fileId: imgBangles.fileId,
                    },
                ],
                sellerId: sellerUser._id,
                storeId: storeDoc._id,
                scope: "GLOBAL",
                variants: [
                    { size: "2.4", color: "22K Yellow Gold", stock: 2, sku: "QBJ-BG-LOTUS-24", price: 168000 },
                    { size: "2.6", color: "22K Yellow Gold", stock: 3, sku: "QBJ-BG-LOTUS-26", price: 168000 },
                    { size: "2.8", color: "22K Yellow Gold", stock: 1, sku: "QBJ-BG-LOTUS-28", price: 168000 },
                ],
                totalStock: 6,
                vertical: "JEWELERY",
                jeweleryDetails: {
                    metalType: "22K Yellow Gold",
                    purity: "22K",
                    hallmark: true,
                    bisMark: "HUID-KL99210",
                    gemstone: "None",
                    weightGrams: 24.6,
                    makingCharge: 12500,
                    wastagePct: 8,
                    certNo: "BIS-KL-2026-8841",
                },
                tags: ["bangle", "kangan", "gold bangles", "bridal", "22k gold", "filigree"],
                seo: {
                    metaTitle: "Kalyani 22K Royal Gold Filigree Bangles (Pair) | QuickBihar Jewels",
                    metaDescription: "Buy handcrafted 22K gold filigree bridal bangles online on QuickBihar.",
                    keywords: ["gold bangles", "bridal kangan", "22k gold", "quickbihar jewellery"],
                },
                isFeatured: true,
                isTrending: true,
                isNewArrival: false,
                deliveryInfo: {
                    isExpressAvailable: false,
                    isCodAvailable: true,
                    estimatedDays: 3,
                    returnPolicy: "7 days easy return",
                },
                compliance: {
                    countryOfOrigin: "India",
                    manufacturerDetail: "QuickBihar Jewels, Dumraon, Bihar - 802133",
                    packerDetail: "QuickBihar Jewels, Dumraon, Bihar - 802133",
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
            },
        },
        { new: true }
    );
    console.log(`   ✔️ Updated Product 2: ${p2?.title} (${p2?._id})`);

    // 5. Insert New Real Products
    console.log("\n✨ 5. Inserting New Real Jewelry Products...");

    const newProducts = [
        {
            title: "Aura 18K Rose Gold Solitaire Diamond Engagement Ring",
            slug: "aura-18k-rose-gold-solitaire-diamond-engagement-ring",
            description:
                "Breathtaking 18K rose gold engagement ring featuring a certified 1.00 Carat round brilliant cut solitaire diamond (VVS1 clarity, E color) secured in a classic 6-prong setting, accented by micro-pavé diamonds along the shank. Stamped with 18K / AU750 hallmark.",
            shortDescription: "1.00 Ct VVS1 Solitaire Diamond Engagement Ring in 18K Rose Gold",
            brand: "QuickBihar Jewels",
            category: "Jewellery",
            subCategory: "Ring",
            gender: "Women",
            price: 84999,
            originalPrice: 99999,
            discountPercentage: 15,
            currency: "INR",
            images: [{ url: imgRing.url, fileId: imgRing.fileId }],
            variants: [
                { size: "12 (Indian)", color: "Rose Gold", stock: 5, sku: "QBJ-RG-DIA-12", price: 84999 },
                { size: "14 (Indian)", color: "Rose Gold", stock: 8, sku: "QBJ-RG-DIA-14", price: 84999 },
                { size: "16 (Indian)", color: "Rose Gold", stock: 4, sku: "QBJ-RG-DIA-16", price: 84999 },
            ],
            totalStock: 17,
            jeweleryDetails: {
                metalType: "18K Rose Gold",
                purity: "18K",
                hallmark: true,
                bisMark: "HUID-AR55190",
                gemstone: "Natural Diamond (VVS1 / E Color)",
                stoneWeightCt: 1.25,
                weightGrams: 3.8,
                makingCharge: 4500,
                wastagePct: 5,
                certNo: "IGI-D489201",
            },
            tags: ["ring", "diamond ring", "engagement ring", "18k rose gold", "solitaire"],
            isFeatured: true,
            isTrending: true,
            isNewArrival: true,
        },
        {
            title: "Swarna Mahal 22K Heritage Gold Peacock Jhumkas with Seed Pearls",
            slug: "swarna-mahal-22k-heritage-gold-peacock-jhumkas-seed-pearls",
            description:
                "Grand royal temple jhumka earrings handcrafted in 22K yellow gold with antique matte patina finish. Features embossed twin peacocks and ruby flower studs with multi-tiered cascading natural freshwater seed pearl droplets. BIS 916 hallmarked.",
            shortDescription: "Authentic 22K Gold Antique Peacock Jhumkas with Seed Pearls",
            brand: "QuickBihar Jewels",
            category: "Jewellery",
            subCategory: "Earrings",
            gender: "Women",
            price: 112500,
            originalPrice: 125000,
            discountPercentage: 10,
            currency: "INR",
            images: [{ url: imgJhumkas.url, fileId: imgJhumkas.fileId }],
            variants: [
                { size: "Standard", color: "Antique 22K Gold", stock: 6, sku: "QBJ-ER-JHM-01", price: 112500 },
            ],
            totalStock: 6,
            jeweleryDetails: {
                metalType: "22K Yellow Gold",
                purity: "22K",
                hallmark: true,
                bisMark: "HUID-SM77231",
                gemstone: "Natural Seed Pearls & Synthetic Ruby",
                stoneWeightCt: 2.1,
                weightGrams: 16.4,
                makingCharge: 9500,
                wastagePct: 8,
                certNo: "BIS-SM-2026-4419",
            },
            tags: ["earrings", "jhumka", "gold earrings", "temple jewellery", "pearls", "bridal"],
            isFeatured: true,
            isTrending: true,
            isNewArrival: false,
        },
        {
            title: "Padmavati Royal 22K Heritage Kundan & Polki Bridal Set",
            slug: "padmavati-royal-22k-heritage-kundan-polki-bridal-set",
            description:
                "Imperial Indian wedding bridal heirloom set crafted in 22K gold. Includes a multi-layered choker necklace, long raani haar, matching chandelier earrings, and royal maang tikka, studded with uncut syndicate polki stones and rich green Zambian emerald tumble drops. Complete with adjustable golden dori.",
            shortDescription: "Opulent 22K Gold Handcrafted Kundan Polki Bridal Choker Set",
            brand: "QuickBihar Jewels",
            category: "Jewellery",
            subCategory: "Bridal Set",
            gender: "Women",
            price: 485000,
            originalPrice: 530000,
            discountPercentage: 8,
            currency: "INR",
            images: [{ url: imgBridal.url, fileId: imgBridal.fileId }],
            variants: [
                {
                    size: "Complete Bridal Set",
                    color: "Gold with Emeralds",
                    stock: 2,
                    sku: "QBJ-BD-PADMA-01",
                    price: 485000,
                },
            ],
            totalStock: 2,
            jeweleryDetails: {
                metalType: "22K Yellow Gold",
                purity: "22K",
                hallmark: true,
                bisMark: "HUID-PD10045",
                gemstone: "Uncut Polki & Natural Emeralds",
                stoneWeightCt: 14.5,
                weightGrams: 68.5,
                makingCharge: 38000,
                wastagePct: 9,
                certNo: "BIS-PD-2026-9021",
            },
            tags: ["bridal set", "wedding jewellery", "kundan", "polki", "choker", "necklace set", "emerald"],
            isFeatured: true,
            isTrending: true,
            isNewArrival: true,
        },
        {
            title: "Devi Laxmi 22K Temple Gold Coin Pendant with Floral Filigree",
            slug: "devi-laxmi-22k-temple-gold-coin-pendant-floral-filigree",
            description:
                "Auspicious 22K yellow gold religious temple pendant featuring Goddess Mahalakshmi seated on a blossoming lotus, flanked by divine elephants. Surrounded by an ornate handcrafted floral filigree circular frame and ruby accents. Represents wealth, prosperity, and divine blessings.",
            shortDescription: "Auspicious 22K Gold Goddess Lakshmi Lotus Temple Coin Pendant",
            brand: "QuickBihar Jewels",
            category: "Jewellery",
            subCategory: "Pendant",
            gender: "Unisex",
            price: 44500,
            originalPrice: 49000,
            discountPercentage: 9,
            currency: "INR",
            images: [{ url: imgCoin.url, fileId: imgCoin.fileId }],
            variants: [
                { size: "Standard (32mm)", color: "22K Yellow Gold", stock: 15, sku: "QBJ-PD-LXMI-01", price: 44500 },
            ],
            totalStock: 15,
            jeweleryDetails: {
                metalType: "22K Yellow Gold",
                purity: "22K",
                hallmark: true,
                bisMark: "HUID-LX33812",
                gemstone: "Natural Ruby Accents",
                stoneWeightCt: 0.35,
                weightGrams: 6.5,
                makingCharge: 3600,
                wastagePct: 6,
                certNo: "BIS-LX-2026-3021",
            },
            tags: ["pendant", "laxmi pendant", "temple jewellery", "gold coin", "religious", "auspicious"],
            isFeatured: true,
            isTrending: false,
            isNewArrival: true,
        },
        {
            title: "Vajra 22K Solid Yellow Gold Singapore Curb Chain",
            slug: "vajra-22k-solid-yellow-gold-singapore-curb-chain",
            description:
                "Heavy-duty 22K yellow gold curb chain with diamond-cut Singapore beveled links that maximize metallic reflection. Fitted with a reinforced lobster clasp for daily and festive wear. Suitable for both men and women.",
            shortDescription: "22K Solid Gold Diamond-Cut Curb Chain for Men & Women",
            brand: "QuickBihar Jewels",
            category: "Jewellery",
            subCategory: "Chain",
            gender: "Unisex",
            price: 76500,
            originalPrice: 84000,
            discountPercentage: 9,
            currency: "INR",
            images: [{ url: imgChain.url, fileId: imgChain.fileId }],
            variants: [
                { size: "20 Inch", color: "22K Yellow Gold", stock: 6, sku: "QBJ-CH-CURB-20", price: 76500 },
                { size: "22 Inch", color: "22K Yellow Gold", stock: 8, sku: "QBJ-CH-CURB-22", price: 83500 },
            ],
            totalStock: 14,
            jeweleryDetails: {
                metalType: "22K Yellow Gold",
                purity: "22K",
                hallmark: true,
                bisMark: "HUID-VJ99401",
                gemstone: "None",
                weightGrams: 11.2,
                makingCharge: 4800,
                wastagePct: 5,
                certNo: "BIS-VJ-2026-6671",
            },
            tags: ["chain", "gold chain", "22k gold chain", "curb chain", "mens chain", "daily wear"],
            isFeatured: false,
            isTrending: true,
            isNewArrival: true,
        },
    ];

    for (const prod of newProducts) {
        const docData: any = {
            ...prod,
            sellerId: sellerUser._id,
            storeId: storeDoc._id,
            scope: "GLOBAL",
            vertical: "JEWELERY",
            isGstApplicable: false,
            gstPercentage: 0,
            seo: {
                metaTitle: `${prod.title} | QuickBihar Jewels`,
                metaDescription: prod.shortDescription,
                keywords: prod.tags,
            },
            deliveryInfo: {
                isExpressAvailable: false,
                isCodAvailable: true,
                estimatedDays: 3,
                returnPolicy: "7 days easy return",
            },
            compliance: {
                countryOfOrigin: "India",
                manufacturerDetail: "QuickBihar Jewels, Dumraon, Bihar - 802133",
                packerDetail: "QuickBihar Jewels, Dumraon, Bihar - 802133",
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

        const upserted = await Product.findOneAndUpdate(
            { slug: prod.slug },
            { $set: docData },
            { upsert: true, new: true }
        );
        console.log(`   ✔️ Created/Updated: ${upserted.title} (${upserted._id})`);
    }

    // 6. Update Category Images in MongoDB
    console.log("\n🏷️ 6. Updating Jewelry Category thumbnails in MongoDB...");
    const categoryImageMap: Record<string, { url: string; fileId: string }> = {
        jewellery: imgShowcase,
        necklace: imgPendant,
        ring: imgRing,
        earrings: imgJhumkas,
        bangle: imgBangles,
        pendant: imgCoin,
        "bridal-set": imgBridal,
        chain: imgChain,
    };

    for (const [slug, img] of Object.entries(categoryImageMap)) {
        const cat = await Category.findOneAndUpdate(
            { slug },
            {
                $set: {
                    image: img.url,
                    imagePublicId: img.fileId,
                    vertical: "JEWELERY",
                    isActive: true,
                    isVisibleOnHome: true,
                },
            },
            { new: true }
        );
        if (cat) {
            console.log(`   ✔️ Category '${cat.title}' (${slug}) -> ${img.url}`);
        } else {
            console.log(`   ⚠️ Category with slug '${slug}' not found.`);
        }
    }

    console.log("\n=================================================");
    console.log("🎉 ALL REAL JEWELRY DATA & IMAGES SUCCESSFULLY SEEDED!");
    console.log("=================================================");

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
