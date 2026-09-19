import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { ENV } from "../config/env.config";
import { uploadToImageKit } from "../utils/imagekit.util";
import { User } from "../modules/common/user/user.model";
import { Store } from "../modules/common/store/store.model";
import { Product } from "../modules/clothing/products/product.model";
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
    console.log(`   ✅ Uploaded: ${uploaded.url}`);
    return uploaded;
}

async function main() {
    console.log("=================================================");
    console.log("✨ SEEDING GEN-Z TRENDY AESTHETIC JEWELRY CATALOG");
    console.log("=================================================");

    await mongoose.connect(ENV.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    const sellerEmail = "aditykbr01@gmail.com";
    const sellerUser = await User.findOne({ email: sellerEmail });
    if (!sellerUser) throw new Error(`Seller user ${sellerEmail} not found`);

    const storeDoc = await Store.findOne({ sellerId: sellerUser._id });
    if (!storeDoc) throw new Error(`Store for seller ${sellerUser._id} not found`);

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

    const brainFiles = fs.readdirSync(BRAIN_DIR);
    const findFile = (prefix: string) => {
        const found = brainFiles.find((f) => f.startsWith(prefix) && f.endsWith(".jpg"));
        if (!found) throw new Error(`Could not find file starting with '${prefix}'`);
        return found;
    };

    const jhumkaFile = findFile("genz_oxidized_jhumka_");
    const evilEyeFile = findFile("genz_evileye_pendant_");
    const butterflyFile = findFile("genz_butterfly_earrings_");
    const ringsFile = findFile("genz_stacking_rings_");
    const charmFile = findFile("genz_charm_bracelet_");

    console.log("\n📸 Uploading Gen-Z AI images to ImageKit...");
    const imgJhumka = await uploadLocalImage(jhumkaFile, "genz_oxidized_mirror_jhumkas.jpg", "products/genz");
    const imgEvilEye = await uploadLocalImage(evilEyeFile, "genz_evileye_paperclip_pendant.jpg", "products/genz");
    const imgButterfly = await uploadLocalImage(butterflyFile, "genz_butterfly_pave_hoops.jpg", "products/genz");
    const imgRings = await uploadLocalImage(ringsFile, "genz_chunky_croissant_rings.jpg", "products/genz");
    const imgCharm = await uploadLocalImage(charmFile, "genz_celestial_star_bracelet.jpg", "products/genz");

    const genZProducts = [
        {
            title: "Afsana 925 Oxidized Sterling Silver Mirror-Work Boho Jhumkas",
            slug: "afsana-925-oxidized-silver-mirror-work-boho-jhumkas",
            description:
                "Trendy Gen-Z staple jhumkas crafted in genuine 925 oxidized sterling silver. Detailed with authentic circular mirror inlays, tribal engraving, and delicate acoustic ghungroo bells that jingle softly with movement. Lightweight, hypoallergenic, and ideal for college, kurti styling, and bohemian aesthetic fits.",
            shortDescription: "925 Oxidized Silver Tribal Mirror Jhumkas with Ghungroos",
            brand: "QuickBihar Gen-Z",
            category: "Jewellery",
            subCategory: "Earrings",
            gender: "Women",
            price: 1499,
            originalPrice: 2499,
            discountPercentage: 40,
            currency: "INR",
            images: [{ url: imgJhumka.url, fileId: imgJhumka.fileId }],
            variants: [
                { size: "Medium (4.5cm)", color: "Oxidized Silver", stock: 25, sku: "GZ-JHM-OXI-01", price: 1499 },
            ],
            totalStock: 25,
            jeweleryDetails: {
                metalType: "925 Sterling Silver",
                purity: "925 Silver",
                hallmark: true,
                bisMark: "925-SILVER-QB",
                gemstone: "Natural Glass Mirrors",
                weightGrams: 12.8,
                makingCharge: 350,
                wastagePct: 3,
                certNo: "SILVER-925-4421",
            },
            tags: ["jhumka", "genz", "oxidized", "silver", "boho", "college-wear", "trendy", "mirror-work"],
            isFeatured: true,
            isTrending: true,
            isNewArrival: true,
        },
        {
            title: "Y2K Dainty 18K Gold Plated Butterfly Pavé Huggie Hoops",
            slug: "y2k-dainty-18k-gold-butterfly-pave-huggie-hoops",
            description:
                "Sweet Korean-inspired Y2K butterfly huggie hoop earrings dipped in 18K yellow gold vermeil. Features dazzling pavé-set Austrian cubic zirconia crystals on the butterfly wings that catch light from every angle. Click-latch closure for comfortable all-day everyday wear.",
            shortDescription: "Dainty 18K Gold Plated Butterfly Huggie Hoops with Pavé Crystals",
            brand: "QuickBihar Gen-Z",
            category: "Jewellery",
            subCategory: "Earrings",
            gender: "Women",
            price: 2199,
            originalPrice: 3499,
            discountPercentage: 37,
            currency: "INR",
            images: [{ url: imgButterfly.url, fileId: imgButterfly.fileId }],
            variants: [
                { size: "12mm Huggie", color: "18K Yellow Gold", stock: 20, sku: "GZ-ER-BTF-01", price: 2199 },
            ],
            totalStock: 20,
            jeweleryDetails: {
                metalType: "18K Gold Vermeil",
                purity: "18K",
                hallmark: true,
                bisMark: "AU750-GZ-99",
                gemstone: "Micro Pavé Zirconia",
                weightGrams: 2.6,
                makingCharge: 400,
                wastagePct: 3,
                certNo: "GZ-18K-0922",
            },
            tags: ["earrings", "butterfly", "huggie", "y2k", "korean", "genz", "aesthetic", "dainty"],
            isFeatured: true,
            isTrending: true,
            isNewArrival: true,
        },
        {
            title: "Aura Nazar 18K Gold Paperclip Chain & Mother-of-Pearl Evil Eye Pendant",
            slug: "aura-nazar-18k-gold-paperclip-chain-evil-eye-pendant",
            description:
                "Viral Pinterest-favorite protection amulet necklace. Features a handcrafted turquoise enamel and iridescent mother-of-pearl evil eye medallion suspended from a contemporary 18K gold paperclip link chain. Designed to ward off negative energy while elevating everyday outfits.",
            shortDescription: "18K Gold Paperclip Chain with Mother-of-Pearl Evil Eye Charm",
            brand: "QuickBihar Gen-Z",
            category: "Jewellery",
            subCategory: "Pendant",
            gender: "Unisex",
            price: 6499,
            originalPrice: 8999,
            discountPercentage: 28,
            currency: "INR",
            images: [{ url: imgEvilEye.url, fileId: imgEvilEye.fileId }],
            variants: [
                { size: "16+2 Inch Adjustable", color: "18K Yellow Gold", stock: 15, sku: "GZ-PD-EYE-01", price: 6499 },
            ],
            totalStock: 15,
            jeweleryDetails: {
                metalType: "18K Yellow Gold",
                purity: "18K",
                hallmark: true,
                bisMark: "HUID-EYE8821",
                gemstone: "Natural Mother of Pearl & Turquoise Enamel",
                weightGrams: 4.2,
                makingCharge: 950,
                wastagePct: 4,
                certNo: "BIS-GZ-2026-3391",
            },
            tags: ["evil eye", "pendant", "necklace", "paperclip chain", "nazar", "genz", "protection"],
            isFeatured: true,
            isTrending: true,
            isNewArrival: true,
        },
        {
            title: "Croissant & Dome Minimalist Chunky Gold Stacking Rings (Set of 3)",
            slug: "croissant-dome-minimalist-chunky-gold-stacking-rings-set",
            description:
                "The ultimate Paris-chic ring stack. A cohesive trio consisting of a ribbed Parisian croissant band, a high-shine chunky dome ring, and a sleek comfort-fit band. Made from heavyweight 18K gold vermeil over 925 sterling silver that won't tarnish or turn green in water.",
            shortDescription: "Tarnish-Free 18K Gold Chunky Dome & Croissant Ring Stack (3-Piece)",
            brand: "QuickBihar Gen-Z",
            category: "Jewellery",
            subCategory: "Ring",
            gender: "Women",
            price: 2899,
            originalPrice: 4299,
            discountPercentage: 33,
            currency: "INR",
            images: [{ url: imgRings.url, fileId: imgRings.fileId }],
            variants: [
                { size: "Set Size 6 (US)", color: "18K Gold Vermeil", stock: 10, sku: "GZ-RG-STK-06", price: 2899 },
                { size: "Set Size 7 (US)", color: "18K Gold Vermeil", stock: 15, sku: "GZ-RG-STK-07", price: 2899 },
                { size: "Set Size 8 (US)", color: "18K Gold Vermeil", stock: 8, sku: "GZ-RG-STK-08", price: 2899 },
            ],
            totalStock: 33,
            jeweleryDetails: {
                metalType: "18K Gold over 925 Silver",
                purity: "925 Silver",
                hallmark: true,
                bisMark: "925-VERMEIL-GZ",
                gemstone: "None",
                weightGrams: 7.5,
                makingCharge: 450,
                wastagePct: 3,
                certNo: "GZ-RNG-SET-331",
            },
            tags: ["rings", "stacking rings", "croissant ring", "dome ring", "chunky rings", "genz", "aesthetic"],
            isFeatured: false,
            isTrending: true,
            isNewArrival: true,
        },
        {
            title: "Stardust Celestial 925 Sterling Silver Crescent Moon & Star Charm Bracelet",
            slug: "stardust-celestial-925-sterling-silver-charm-bracelet",
            description:
                "Ethereal celestial charm bracelet handcrafted in solid 925 sterling silver with rhodium anti-tarnish plating. Features a diamond-dusted crescent moon, twinkling North star, and faceted crystal dewdrop charms along an adjustable beaded link chain. Stamped with 925 hallmark tag.",
            shortDescription: "Solid 925 Sterling Silver Celestial Moon & Star Charm Bracelet",
            brand: "QuickBihar Gen-Z",
            category: "Jewellery",
            subCategory: "Bangle",
            gender: "Women",
            price: 3199,
            originalPrice: 4899,
            discountPercentage: 35,
            currency: "INR",
            images: [{ url: imgCharm.url, fileId: imgCharm.fileId }],
            variants: [
                { size: "6.5 + 1.5 Inch Extender", color: "Rhodium Silver", stock: 18, sku: "GZ-BR-STAR-01", price: 3199 },
            ],
            totalStock: 18,
            jeweleryDetails: {
                metalType: "925 Sterling Silver",
                purity: "925 Silver",
                hallmark: true,
                bisMark: "925-STARDUST",
                gemstone: "Micro Pavé Zirconia & Crystal Drops",
                weightGrams: 6.8,
                makingCharge: 600,
                wastagePct: 4,
                certNo: "SILVER-GZ-2026-9011",
            },
            tags: ["bracelet", "charm bracelet", "celestial", "moon and stars", "925 silver", "genz", "aesthetic"],
            isFeatured: true,
            isTrending: true,
            isNewArrival: true,
        },
    ];

    console.log("\n✨ Inserting Gen-Z Jewelry into MongoDB...");
    for (const prod of genZProducts) {
        const docData: any = {
            ...prod,
            sellerId: sellerUser._id,
            storeId: storeDoc._id,
            scope: "GLOBAL",
            vertical: "JEWELERY",
            isGstApplicable: false,
            gstPercentage: 0,
            seo: {
                metaTitle: `${prod.title} | QuickBihar Gen-Z`,
                metaDescription: prod.shortDescription,
                keywords: prod.tags,
            },
            deliveryInfo: {
                isExpressAvailable: true,
                isCodAvailable: true,
                estimatedDays: 2,
                returnPolicy: "7 days easy return",
            },
            compliance: {
                countryOfOrigin: "India",
                manufacturerDetail: "QuickBihar Gen-Z Studios, Dumraon, Bihar - 802133",
                packerDetail: "QuickBihar Gen-Z Studios, Dumraon, Bihar - 802133",
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
            { upsert: true, returnDocument: "after" }
        );
        console.log(`   ✔️ Created/Updated Gen-Z Product: ${upserted?.title} (${upserted?._id})`);
    }

    console.log("\n=================================================");
    console.log("🎉 ALL 5 GEN-Z PRODUCTS SEEDED SUCCESSFULLY!");
    console.log("=================================================");

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
