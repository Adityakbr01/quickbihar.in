import { User } from "../modules/user/user.model";
import { SizeChart } from "../modules/sizeChart/sizeChart.model";
import { ENV } from "../config/env.config";
import { RefundPolicy } from "../modules/refundPolicy/refundPolicy.model";

export const seedAdmin = async () => {
    try {
        const adminEmail = ENV.ADMIN_EMAIL;
        const adminPassword = ENV.ADMIN_PASSWORD;

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            console.log("🌱 Seeding Admin User...");

            await User.create({
                username: "admin",
                email: adminEmail,
                password: adminPassword,
                fullName: "System Administrator",
                role: "admin",
            });

            console.log("✅ Admin User seeded successfully!");
        } else {
            console.log("ℹ️ Admin User already exists, skipping seed.");
        }
    } catch (error) {
        console.error("❌ Failed to seed Admin User:", error);
    }
};


export const seedSizeCharts = async () => {
    try {
        console.log("🌱 Seeding Size Charts (Production Safe)...");

        const commonCharts = [

            // ================= MEN =================
            {
                name: "Men's T-Shirt",
                category: "Men",
                subCategory: "T-Shirt",
                unit: "inches",
                fields: ["Size", "Chest", "Length", "Shoulder"],
                data: [
                    { size: "S", Chest: 38, Length: 27, Shoulder: 17 },
                    { size: "M", Chest: 40, Length: 28, Shoulder: 18 },
                    { size: "L", Chest: 42, Length: 29, Shoulder: 19 },
                    { size: "XL", Chest: 44, Length: 30, Shoulder: 20 },
                    { size: "XXL", Chest: 46, Length: 31, Shoulder: 21 },
                ],
                howToMeasure: [
                    "Chest: Measure around fullest chest.",
                    "Shoulder: One shoulder end to other.",
                    "Length: Shoulder to bottom."
                ]
            },
            {
                name: "Men's Shirt",
                category: "Men",
                subCategory: "Shirt",
                unit: "inches",
                fields: ["Size", "Chest", "Shoulder", "Sleeve", "Length"],
                data: [
                    { size: "38", Chest: 40, Shoulder: 18, Sleeve: 25, Length: 29 },
                    { size: "40", Chest: 42, Shoulder: 19, Sleeve: 26, Length: 30 },
                    { size: "42", Chest: 44, Shoulder: 20, Sleeve: 27, Length: 31 },
                    { size: "44", Chest: 46, Shoulder: 21, Sleeve: 28, Length: 32 },
                ],
                howToMeasure: [
                    "Chest: Around fullest chest.",
                    "Sleeve: Shoulder to wrist.",
                    "Shoulder: End to end."
                ]
            },
            {
                name: "Men's Jeans",
                category: "Men",
                subCategory: "Jeans",
                unit: "inches",
                fields: ["Size", "Waist", "Hip", "Length"],
                data: [
                    { size: "30", Waist: 30, Hip: 38, Length: 40 },
                    { size: "32", Waist: 32, Hip: 40, Length: 41 },
                    { size: "34", Waist: 34, Hip: 42, Length: 42 },
                    { size: "36", Waist: 36, Hip: 44, Length: 43 },
                ],
                howToMeasure: [
                    "Waist: Natural waistline.",
                    "Hip: Fullest hip part."
                ]
            },

            // ================= WOMEN =================
            {
                name: "Women's Top / Kurti",
                category: "Women",
                subCategory: "Top",
                unit: "inches",
                fields: ["Size", "Bust", "Waist", "Hip"],
                data: [
                    { size: "S", Bust: 34, Waist: 28, Hip: 36 },
                    { size: "M", Bust: 36, Waist: 30, Hip: 38 },
                    { size: "L", Bust: 38, Waist: 32, Hip: 40 },
                    { size: "XL", Bust: 40, Waist: 34, Hip: 42 },
                    { size: "XXL", Bust: 42, Waist: 36, Hip: 44 },
                ],
                howToMeasure: [
                    "Bust: Fullest bust.",
                    "Waist: Natural waist.",
                    "Hip: Full hip."
                ]
            },
            {
                name: "Women's Jeans",
                category: "Women",
                subCategory: "Jeans",
                unit: "inches",
                fields: ["Size", "Waist", "Hip", "Length"],
                data: [
                    { size: "28", Waist: 28, Hip: 36, Length: 38 },
                    { size: "30", Waist: 30, Hip: 38, Length: 39 },
                    { size: "32", Waist: 32, Hip: 40, Length: 40 },
                    { size: "34", Waist: 34, Hip: 42, Length: 41 },
                ],
                howToMeasure: [
                    "Waist: Natural waistline.",
                    "Hip: Full hip."
                ]
            },

            // ================= KIDS =================
            {
                name: "Kids Clothing",
                category: "Kids",
                subCategory: "General",
                unit: "inches",
                fields: ["Age", "Height", "Chest"],
                data: [
                    { size: "2-3Y", Height: 36, Chest: 20 },
                    { size: "3-4Y", Height: 40, Chest: 22 },
                    { size: "5-6Y", Height: 44, Chest: 24 },
                    { size: "7-8Y", Height: 48, Chest: 26 },
                    { size: "9-10Y", Height: 52, Chest: 28 },
                ],
                howToMeasure: [
                    "Height: Head to toe.",
                    "Chest: Around chest."
                ]
            },

            // ================= JEWELLERY =================
            {
                name: "Ring Size",
                category: "Jewellery",
                subCategory: "Ring",
                unit: "mm",
                fields: ["Size", "Diameter"],
                data: [
                    { size: "6", Diameter: 16.5 },
                    { size: "7", Diameter: 17.3 },
                    { size: "8", Diameter: 18.1 },
                    { size: "9", Diameter: 18.9 },
                    { size: "10", Diameter: 19.8 },
                ],
                howToMeasure: [
                    "Measure finger diameter using ring or thread."
                ]
            },
            {
                name: "Necklace Length",
                category: "Jewellery",
                subCategory: "Necklace",
                unit: "inches",
                fields: ["Type", "Length"],
                data: [
                    { size: "Choker", Length: 14 },
                    { size: "Princess", Length: 18 },
                    { size: "Matinee", Length: 22 },
                    { size: "Opera", Length: 28 },
                ],
                howToMeasure: [
                    "Measure around neck for comfort fit."
                ]
            }
        ];

        for (const chart of commonCharts) {
            await SizeChart.updateOne(
                { name: chart.name, category: chart.category },
                { $setOnInsert: chart },
                { upsert: true }
            );
            console.log(`✔️ Processed: ${chart.name}`);
        }

        console.log("🎉 All Size Charts Seeded Successfully!");
    } catch (error) {
        console.error("❌ Seed Error:", error);
    }
};


export const seedRefundPolicies = async () => {
    try {
        console.log("🌱 Seeding Refund Policies (Pro Level)...");

        const commonRefundPolicies = [

            // ================= GENERAL =================
            {
                name: "7-Day Easy Return",
                category: "General",
                description: "Return within 7 days for most products",
                returnWindowDays: 7,
                refundProcessingDays: 5,
                conditions: [
                    "Product must be unused and unwashed",
                    "Original packaging & tags required",
                    "Invoice must be available"
                ],
                refundType: "Original Payment Method",
                returnShipping: "Customer",
                isReturnable: true,
                isExchangeAvailable: true,
                isActive: true,
            },

            {
                name: "10-Day Replacement Only",
                category: "General",
                description: "Replacement available, no refund",
                returnWindowDays: 10,
                refundProcessingDays: 0,
                conditions: [
                    "Only defective or damaged products eligible",
                    "Unboxing video required for damage claims"
                ],
                refundType: "No Refund",
                returnShipping: "Seller",
                isReturnable: false,
                isExchangeAvailable: true,
                isActive: true,
            },

            // ================= CLOTHING =================
            {
                name: "Fashion 7-Day Return",
                category: "Clothing",
                description: "Return allowed for clothing items",
                returnWindowDays: 7,
                refundProcessingDays: 5,
                conditions: [
                    "Item must not be worn",
                    "Tags must be intact",
                    "No perfume or stains"
                ],
                refundType: "Original Payment Method",
                returnShipping: "Customer",
                isReturnable: true,
                isExchangeAvailable: true,
                isActive: true,
            },

            {
                name: "Innerwear No Return",
                category: "Clothing",
                description: "Hygiene sensitive products",
                returnWindowDays: 0,
                refundProcessingDays: 0,
                conditions: [
                    "Non-returnable due to hygiene reasons"
                ],
                refundType: "No Refund",
                returnShipping: "Not Applicable",
                isReturnable: false,
                isExchangeAvailable: false,
                isActive: true,
            },

            // ================= JEWELLERY =================
            {
                name: "Jewellery 3-Day Return",
                category: "Jewellery",
                description: "Short return window for jewellery",
                returnWindowDays: 3,
                refundProcessingDays: 5,
                conditions: [
                    "Item must be unused",
                    "Original box required",
                    "No scratches or damage"
                ],
                refundType: "Wallet / Bank",
                returnShipping: "Customer",
                isReturnable: true,
                isExchangeAvailable: true,
                isActive: true,
            },

            {
                name: "Custom Jewellery No Return",
                category: "Jewellery",
                description: "Customized jewellery items",
                returnWindowDays: 0,
                refundProcessingDays: 0,
                conditions: [
                    "Customized products cannot be returned"
                ],
                refundType: "No Refund",
                returnShipping: "Not Applicable",
                isReturnable: false,
                isExchangeAvailable: false,
                isActive: true,
            },

            // ================= ELECTRONICS =================
            {
                name: "Electronics 7-Day Replacement",
                category: "Electronics",
                description: "Replacement only for electronics",
                returnWindowDays: 7,
                refundProcessingDays: 0,
                conditions: [
                    "Only defective products eligible",
                    "All accessories must be returned",
                    "Original packaging required"
                ],
                refundType: "Replacement Only",
                returnShipping: "Seller",
                isReturnable: false,
                isExchangeAvailable: true,
                isActive: true,
            },

            // ================= NO RETURN =================
            {
                name: "Final Sale - No Return",
                category: "Sale",
                description: "Discounted products are non-returnable",
                returnWindowDays: 0,
                refundProcessingDays: 0,
                conditions: [
                    "Products under sale are non-returnable"
                ],
                refundType: "No Refund",
                returnShipping: "Not Applicable",
                isReturnable: false,
                isExchangeAvailable: false,
                isActive: true,
            }
        ];

        for (const policy of commonRefundPolicies) {
            await RefundPolicy.updateOne(
                { name: policy.name, category: policy.category },
                { $setOnInsert: policy },
                { upsert: true }
            );
            console.log(`✔️ Processed: ${policy.name}`);
        }

        console.log("🎉 All Refund Policies Seeded Successfully!");
    } catch (error) {
        console.error("❌ Seed Error:", error);
    }
};