import { User } from "../modules/user/user.model";
import { SizeChart } from "../modules/sizeChart/sizeChart.model";
import { ENV } from "../config/env.config";
import { RefundPolicy } from "../modules/refundPolicy/refundPolicy.model";
import { AppConfig } from "../modules/appConfig/appConfig.model";
import { DeliveryBoy } from "../modules/deliveryBoy/delivery.model";

export const seedAppConfig = async () => {
    try {
        console.log("🌱 Seeding App Configuration...");

        const defaultConfig = {
            policies: {
                privacyPolicy: "Default Privacy Policy - Please Update",
                termsAndConditions: "Default Terms and Conditions - Please Update",
                returnPolicy: "7 Days Easy Return Policy",
                shippingPolicy: "Standard Shipping Policy",
            },
            contact: {
                email: "support@quickbihar.in",
                phone: "+91 0000000000",
                whatsapp: "+91 0000000000",
                address: "Bihar, India",
            },
            socialLinks: {
                facebook: "https://facebook.com/quickbihar",
                instagram: "https://instagram.com/quickbihar",
                twitter: "https://twitter.com/quickbihar",
                youtube: "https://youtube.com/quickbihar",
            },
            seo: {
                metaTitle: "Quick Bihar - Premium E-commerce",
                metaDescription: "The best shopping experience in Bihar.",
                keywords: ["shopping", "ecommerce", "bihar", "quickbihar"],
            },
            shipping: {
                freeShippingThreshold: 2000,
                shippingFee: 99,
            },
            appearance: {
                logoUrl: "",
                faviconUrl: "",
            },
            delivery: {
                defaultRadiusKm: 5,
                minOrderAmount: 0,
                estimatedMinutes: 45,
                riderPayoutAmount: 40,
            },
        };

        const existing = await AppConfig.findOne();
        if (!existing) {
            await AppConfig.create(defaultConfig);
            console.log("✅ App Config seeded successfully!");
        } else {
            console.log("ℹ️ App Config already exists, checking for missing fields...");
            // Ensure shipping rules exist even if config exists
            if (!existing.shipping) {
                existing.shipping = defaultConfig.shipping;
                await existing.save();
                console.log("✅ Updated App Config with shipping rules!");
            }
        }
    } catch (error) {
        console.error("❌ Failed to seed App Config:", error);
    }
};

export const seedAdmin = async () => {
    try {
        const adminEmail = ENV.ADMIN_EMAIL;
        const adminPassword = ENV.ADMIN_PASSWORD;

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            console.log("🌱 Seeding Admin User...");

            const adminRole = await Role.findOne({ name: "ADMIN" });
            if (!adminRole) throw new Error("ADMIN role not found. Seed RBAC before users.");

            await User.create({
                username: "admin",
                email: adminEmail,
                password: adminPassword,
                fullName: "System Administrator",
                roleId: adminRole._id,
                isVerified: true,
            });

            console.log("✅ Admin User seeded successfully!");
        } else {
            console.log("ℹ️ Admin User already exists, skipping seed.");
        }
    } catch (error) {
        console.error("❌ Failed to seed Admin User:", error);
    }
};

export const seedUsers = async () => {
    try {
        console.log("🌱 Seeding Development Users...");

        const devUsers = [
            {
                username: "customer1",
                email: "user@example.com",
                password: "password123",
                fullName: "Test Customer",
                role: "USER",
            },
            {
                username: "seller1",
                email: "seller@example.com",
                password: "password123",
                fullName: "Test Seller",
                role: "SELLER",
            },
            {
                username: "delivery1",
                email: "delivery@example.com",
                password: "password123",
                fullName: "Test Delivery Partner",
                role: "DELIVERY",
            }
        ];

        for (const u of devUsers) {
            const existing = await User.findOne({ email: u.email });
            const role = await Role.findOne({ name: u.role });
            if (!role) {
                console.warn(`Skipping ${u.email}: role ${u.role} not found.`);
                continue;
            }
            if (!existing) {
                await User.create({
                    username: u.username,
                    email: u.email,
                    password: u.password,
                    fullName: u.fullName,
                    roleId: role._id,
                    isVerified: true,
                });
                if (u.role === "DELIVERY") {
                    const user = await User.findOne({ email: u.email });
                    if (user) {
                        await DeliveryBoy.updateOne(
                            { userId: user._id },
                            {
                                $setOnInsert: {
                                    userId: user._id,
                                    vehicleType: "BIKE",
                                    vehicleNumber: "BR01QB0001",
                                    licenseNumber: "DL-DEMO-0001",
                                    status: "APPROVED",
                                    isVerified: true,
                                    isOnline: true,
                                    wallet: {
                                        availableBalance: 0,
                                        pendingPayoutBalance: 0,
                                        lifetimeEarnings: 0,
                                    },
                                },
                            },
                            { upsert: true },
                        );
                    }
                }
                console.log(`✔️ Created user: ${u.username}`);
            }
        }
    } catch (error) {
        console.error("❌ Failed to seed development users:", error);
    }
};


export const seedSizeCharts = async () => {
    try {
        console.log("🌱 Seeding Size Charts (Production Safe)...");

        const commonCharts = [
            // ================= MEN =================
            {
                name: "Men's T-Shirt Size Chart",
                description: "Standard Men's T-Shirt size chart (S to XXL) covering Chest, Length, and Shoulder measurements. Ideal for polo shirts, round necks, and casual tees.",
                category: "Men",
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
                    "Chest: Measure around the fullest part of your chest, keeping the tape horizontal.",
                    "Shoulder: Measure from one shoulder tip to the other across the back.",
                    "Length: Measure from the highest point of the shoulder down to the bottom hem."
                ]
            },
            {
                name: "Men's Formal & Casual Shirt Size Chart",
                description: "Standard Men's Shirt sizes (38 to 46) mapping collar neck size, chest, shoulder, sleeve, and back length. Ideal for formal, casual, and denim shirts.",
                category: "Men",
                unit: "inches",
                fields: ["Size", "Collar", "Chest", "Shoulder", "Sleeve", "Length"],
                data: [
                    { size: "38 (S)", Collar: 15, Chest: 40, Shoulder: 18, Sleeve: 24.5, Length: 29 },
                    { size: "40 (M)", Collar: 15.7, Chest: 42, Shoulder: 18.5, Sleeve: 25, Length: 30 },
                    { size: "42 (L)", Collar: 16.5, Chest: 44, Shoulder: 19.5, Sleeve: 25.5, Length: 31 },
                    { size: "44 (XL)", Collar: 17.3, Chest: 46, Shoulder: 20.5, Sleeve: 26, Length: 32 },
                    { size: "46 (XXL)", Collar: 18.1, Chest: 48, Shoulder: 21.5, Sleeve: 26.5, Length: 33 },
                ],
                howToMeasure: [
                    "Collar/Neck: Measure around the base of your neck where a collared shirt would sit.",
                    "Chest: Measure around the fullest part of your chest.",
                    "Shoulder: Measure from one shoulder tip to the other across the back.",
                    "Sleeve: Measure from the shoulder tip to the wrist."
                ]
            },
            {
                name: "Men's Jeans & Trousers Size Chart",
                description: "Men's bottomwear size chart (30 to 40) for jeans, chinos, and trousers. Maps waist circumference, hip, and length.",
                category: "Men",
                unit: "inches",
                fields: ["Size", "Waist", "Hip", "Inseam", "Outseam"],
                data: [
                    { size: "30", Waist: 30, Hip: 38, Inseam: 30, Outseam: 40 },
                    { size: "32", Waist: 32, Hip: 40, Inseam: 30.5, Outseam: 41 },
                    { size: "34", Waist: 34, Hip: 42, Inseam: 31, Outseam: 42 },
                    { size: "36", Waist: 36, Hip: 44, Inseam: 31.5, Outseam: 43 },
                    { size: "38", Waist: 38, Hip: 46, Inseam: 32, Outseam: 44 },
                    { size: "40", Waist: 40, Hip: 48, Inseam: 32, Outseam: 44.5 },
                ],
                howToMeasure: [
                    "Waist: Measure around your natural waistline, where you normally wear your pants.",
                    "Hip: Measure around the fullest part of your hips.",
                    "Inseam: Measure from the crotch point to the ankle bone along the inner leg."
                ]
            },
            {
                name: "Men's Ethnic Kurta Size Chart",
                description: "Men's ethnic Kurta sizes (S to XXL) with a comfortable, relaxed fit. Covers chest, shoulder, sleeve, and kurta length.",
                category: "Men",
                unit: "inches",
                fields: ["Size", "Chest", "Shoulder", "Sleeve", "Kurta Length"],
                data: [
                    { size: "S (38)", Chest: 40, Shoulder: 17.5, Sleeve: 24, "Kurta Length": 38 },
                    { size: "M (40)", Chest: 42, Shoulder: 18, Sleeve: 24.5, "Kurta Length": 40 },
                    { size: "L (42)", Chest: 44, Shoulder: 19, Sleeve: 25, "Kurta Length": 42 },
                    { size: "XL (44)", Chest: 46, Shoulder: 20, Sleeve: 25.5, "Kurta Length": 44 },
                    { size: "XXL (46)", Chest: 48, Shoulder: 21, Sleeve: 26, "Kurta Length": 44.5 },
                ],
                howToMeasure: [
                    "Chest: Measure around the chest with 2 inches of breathing margin added.",
                    "Kurta Length: Measure from the collar junction down to the knee or desired length."
                ]
            },
            {
                name: "Men's Footwear (Shoes) Size Chart",
                description: "Standard Indian/UK shoe sizes for Men (UK 6 to UK 11) with foot length in cm and US/EU conversions. Useful for casual, formal, and athletic shoes.",
                category: "Men",
                unit: "cm",
                fields: ["Size (UK)", "US Size", "EU Size", "Foot Length (cm)", "Foot Length (inches)"],
                data: [
                    { "Size (UK)": "UK 6", "US Size": "7", "EU Size": "40", "Foot Length (cm)": 25.4, "Foot Length (inches)": 10 },
                    { "Size (UK)": "UK 7", "US Size": "8", "EU Size": "41", "Foot Length (cm)": 26.3, "Foot Length (inches)": 10.3 },
                    { "Size (UK)": "UK 8", "US Size": "9", "EU Size": "42", "Foot Length (cm)": 27.2, "Foot Length (inches)": 10.7 },
                    { "Size (UK)": "UK 9", "US Size": "10", "EU Size": "43", "Foot Length (cm)": 28.0, "Foot Length (inches)": 11 },
                    { "Size (UK)": "UK 10", "US Size": "11", "EU Size": "44.5", "Foot Length (cm)": 28.9, "Foot Length (inches)": 11.4 },
                    { "Size (UK)": "UK 11", "US Size": "12", "EU Size": "46", "Foot Length (cm)": 29.8, "Foot Length (inches)": 11.7 },
                ],
                howToMeasure: [
                    "Foot Length: Place your foot on a sheet of paper, mark the tip of your longest toe and back of your heel, then measure the distance."
                ]
            },

            // ================= WOMEN =================
            {
                name: "Women's Kurti & Top Size Chart",
                description: "Standard Women's Kurti and Topwear sizes (XS to XXL) covering bust, waist, and shoulder. Fits ethnic kurtis, shirts, tops, and tees.",
                category: "Women",
                unit: "inches",
                fields: ["Size", "Bust", "Waist", "Shoulder", "Length"],
                data: [
                    { size: "XS", Bust: 32, Waist: 26, Shoulder: 13.5, Length: 24 },
                    { size: "S", Bust: 34, Waist: 28, Shoulder: 14, Length: 24.5 },
                    { size: "M", Bust: 36, Waist: 30, Shoulder: 14.5, Length: 25 },
                    { size: "L", Bust: 38, Waist: 32, Shoulder: 15, Length: 25.5 },
                    { size: "XL", Bust: 40, Waist: 34, Shoulder: 15.5, Length: 26 },
                    { size: "XXL", Bust: 42, Waist: 36, Shoulder: 16, Length: 26.5 },
                ],
                howToMeasure: [
                    "Bust: Measure around the fullest part of your bust.",
                    "Waist: Measure around your natural waistline, typically the narrowest part of your torso.",
                    "Shoulder: Measure across the back from one shoulder point to the other."
                ]
            },
            {
                name: "Women's Jeans & Bottomwear Size Chart",
                description: "Women's bottomwear sizes (26 to 36) mapping waist, hips, and outseam length. Suitable for jeans, leggings, trousers, and skirts.",
                category: "Women",
                unit: "inches",
                fields: ["Size", "Waist", "Hip", "Outseam"],
                data: [
                    { size: "26", Waist: 26, Hip: 34, Outseam: 38 },
                    { size: "28", Waist: 28, Hip: 36, Outseam: 38.5 },
                    { size: "30", Waist: 30, Hip: 38, Outseam: 39 },
                    { size: "32", Waist: 32, Hip: 40, Outseam: 39.5 },
                    { size: "34", Waist: 34, Hip: 42, Outseam: 40 },
                    { size: "36", Waist: 36, Hip: 44, Outseam: 40.5 },
                ],
                howToMeasure: [
                    "Waist: Measure around the waist where you prefer your waistband to sit.",
                    "Hip: Measure around the fullest part of your seat."
                ]
            },
            {
                name: "Women's One-Piece Dress Size Chart",
                description: "Standard Women's dress size chart (XS to XL) for one-piece dresses, gowns, and jumpsuits. Maps bust, waist, hips, and dress length.",
                category: "Women",
                unit: "inches",
                fields: ["Size", "Bust", "Waist", "Hip", "Dress Length"],
                data: [
                    { size: "XS", Bust: 32, Waist: 26, Hip: 35, "Dress Length": 36 },
                    { size: "S", Bust: 34, Waist: 28, Hip: 37, "Dress Length": 37 },
                    { size: "M", Bust: 36, Waist: 30, Hip: 39, "Dress Length": 38 },
                    { size: "L", Bust: 38, Waist: 32, Hip: 41, "Dress Length": 39 },
                    { size: "XL", Bust: 40, Waist: 34, Hip: 43, "Dress Length": 40 },
                ],
                howToMeasure: [
                    "Bust: Measure around the fullest part of the bust.",
                    "Waist: Measure around the narrowest part of the waist.",
                    "Dress Length: Measure from the highest point of the shoulder down to the dress hem."
                ]
            },
            {
                name: "Women's Footwear (Shoes & Sandals) Size Chart",
                description: "Standard Indian/UK shoe sizes for Women (UK 3 to UK 8) with foot length in cm and US/EU conversions. Ideal for heels, flats, sneakers, and sandals.",
                category: "Women",
                unit: "cm",
                fields: ["Size (UK)", "US Size", "EU Size", "Foot Length (cm)", "Foot Length (inches)"],
                data: [
                    { "Size (UK)": "UK 3", "US Size": "5", "EU Size": "36", "Foot Length (cm)": 22.8, "Foot Length (inches)": 9.0 },
                    { "Size (UK)": "UK 4", "US Size": "6", "EU Size": "37", "Foot Length (cm)": 23.7, "Foot Length (inches)": 9.3 },
                    { "Size (UK)": "UK 5", "US Size": "7", "EU Size": "38", "Foot Length (cm)": 24.5, "Foot Length (inches)": 9.6 },
                    { "Size (UK)": "UK 6", "US Size": "8", "EU Size": "39", "Foot Length (cm)": 25.4, "Foot Length (inches)": 10.0 },
                    { "Size (UK)": "UK 7", "US Size": "9", "EU Size": "40", "Foot Length (cm)": 26.2, "Foot Length (inches)": 10.3 },
                    { "Size (UK)": "UK 8", "US Size": "10", "EU Size": "41", "Foot Length (cm)": 27.0, "Foot Length (inches)": 10.6 },
                ],
                howToMeasure: [
                    "Foot Length: Measure the longest distance from your heel to your big toe."
                ]
            },

            // ================= KIDS =================
            {
                name: "Kids' Apparel (Toddler to Teen) Size Chart",
                description: "General Kids' clothing size chart sorted by age group (2-3Y to 11-12Y) with average height, waist, and chest. Fits t-shirts, dresses, and sets.",
                category: "Kids",
                unit: "inches",
                fields: ["Size (Age)", "Height (inches)", "Chest (inches)", "Waist (inches)"],
                data: [
                    { "Size (Age)": "2-3Y", "Height (inches)": 38, "Chest (inches)": 21, "Waist (inches)": 20 },
                    { "Size (Age)": "3-4Y", "Height (inches)": 41, "Chest (inches)": 22, "Waist (inches)": 21 },
                    { "Size (Age)": "5-6Y", "Height (inches)": 46, "Chest (inches)": 24, "Waist (inches)": 22 },
                    { "Size (Age)": "7-8Y", "Height (inches)": 51, "Chest (inches)": 26, "Waist (inches)": 23 },
                    { "Size (Age)": "9-10Y", "Height (inches)": 55, "Chest (inches)": 28, "Waist (inches)": 24 },
                    { "Size (Age)": "11-12Y", "Height (inches)": 60, "Chest (inches)": 30, "Waist (inches)": 25 },
                ],
                howToMeasure: [
                    "Height: Measure children standing flat against a wall without shoes.",
                    "Chest: Measure around the fullest part of the chest."
                ]
            },
            {
                name: "Kids' Footwear Size Chart",
                description: "Standard Indian/UK shoe sizes for kids mapped by child's age group and foot length in cm. Helps parents choose the correct shoe size.",
                category: "Kids",
                unit: "cm",
                fields: ["Size (UK)", "Age Group", "Foot Length (cm)"],
                data: [
                    { "Size (UK)": "UK 4C", "Age Group": "1-2 Years", "Foot Length (cm)": 11.5 },
                    { "Size (UK)": "UK 5C", "Age Group": "2-2.5 Years", "Foot Length (cm)": 12.3 },
                    { "Size (UK)": "UK 6C", "Age Group": "2.5-3 Years", "Foot Length (cm)": 13.2 },
                    { "Size (UK)": "UK 7C", "Age Group": "3-3.5 Years", "Foot Length (cm)": 14.0 },
                    { "Size (UK)": "UK 8C", "Age Group": "3-3.5 Years", "Foot Length (cm)": 14.8 },
                    { "Size (UK)": "UK 9C", "Age Group": "4-4.5 Years", "Foot Length (cm)": 15.7 },
                    { "Size (UK)": "UK 10C", "Age Group": "4.5-5 Years", "Foot Length (cm)": 16.5 },
                ],
                howToMeasure: [
                    "Foot Length: Mark heel and toe on a paper while the child stands, and measure the length."
                ]
            }
        ];

        for (const chart of commonCharts) {
            await SizeChart.updateOne(
                { name: chart.name, category: chart.category },
                { $set: chart },
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

            // ================= RETURN POLICIES =================
            {
                name: "7-Day Easy Return",
                policyType: "RETURN",
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
                policyType: "RETURN",
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

            {
                name: "Fashion 7-Day Return",
                policyType: "RETURN",
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
                policyType: "RETURN",
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

            {
                name: "Final Sale - No Return",
                policyType: "RETURN",
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
            },

            // ================= REFUND POLICIES =================
            {
                name: "Full Refund (Original Payment)",
                policyType: "REFUND",
                category: "General",
                description: "Full refund to original payment method",
                refundProcessingDays: 5,
                conditions: [
                    "Eligible after successful return validation",
                    "Takes 5-7 working days to reflect in account"
                ],
                isActive: true,
            },
            {
                name: "Store Credit Refund",
                policyType: "REFUND",
                category: "General",
                description: "Refund as store wallet balance",
                refundProcessingDays: 1,
                conditions: [
                    "Credited to user wallet within 24 hours",
                    "Can be used for any future purchase"
                ],
                isActive: true,
            },

            // ================= SHIPPING POLICIES =================
            {
                name: "Standard Shipping (3-5 Days)",
                policyType: "SHIPPING",
                category: "General",
                description: "Standard delivery across India",
                conditions: [
                    "Free shipping on orders above ₹999",
                    "Delivery within 3 to 5 business days",
                    "Tracking link provided via SMS/Email"
                ],
                isActive: true,
            },
            {
                name: "Express Delivery (1-2 Days)",
                policyType: "SHIPPING",
                category: "General",
                description: "Fast delivery to select cities",
                conditions: [
                    "Chargeable express shipping rates apply",
                    "Delivery within 24 to 48 hours",
                    "Available for pre-paid orders only"
                ],
                isActive: true,
            },

            // ================= TERMS POLICIES =================
            {
                name: "Standard Terms of Service",
                policyType: "TERMS",
                category: "General",
                description: "Basic terms and conditions for purchase",
                conditions: [
                    "Prices are inclusive of applicable taxes",
                    "Orders can be cancelled before dispatch",
                    "Color of products may slightly vary due to lighting"
                ],
                isActive: true,
            }
        ];

        for (const policy of commonRefundPolicies) {
            await RefundPolicy.updateOne(
                { name: policy.name, category: policy.category },
                { $set: policy },
                { upsert: true }
            );
            console.log(`✔️ Processed: ${policy.name}`);
        }

        console.log("🎉 All Refund/Shipping/Terms Policies Seeded Successfully!");
    } catch (error) {
        console.error("❌ Seed Error:", error);
    }
};


import { Role, Permission, RolePermission } from "../modules/rbac/rbac.model";
import { PERMISSIONS, ROLES } from "../modules/rbac/rbac.constants";
import { ROLE_PERMISSION_MAP } from "../modules/rbac/ROLE_PERMISSION_MAP";

export const seedRbac = async () => {
    try {
        console.log("🌱 Seeding RBAC Configuration (Non-destructive)...");

        // 1. Sync Roles
        for (const roleName of Object.values(ROLES)) {
            await Role.updateOne(
                { name: roleName },
                { $setOnInsert: { name: roleName, isActive: true, description: `System role for ${roleName}` } },
                { upsert: true }
            );
        }
        console.log("✔️ Roles synchronized.");

        // 2. Sync Permissions
        const permCodes = Object.values(PERMISSIONS);
        for (const p of permCodes) {
            await Permission.updateOne(
                { code: p.code },
                { $set: { module: p.module, description: p.description, domain: (p as any).domain || "GLOBAL" } }, // Update metadata if changed
                { upsert: true }
            );
        }
        console.log("✔️ Permissions synchronized.");

        // 3. Sync Role-Permission Mapping
        for (const [roleName, permissionsList] of Object.entries(ROLE_PERMISSION_MAP)) {
            const roleDoc = await Role.findOne({ name: roleName });
            if (!roleDoc) continue;

            for (const permCode of permissionsList) {
                const permDoc = await Permission.findOne({ code: permCode });
                if (!permDoc) continue;

                await RolePermission.updateOne(
                    { roleId: roleDoc._id, permissionId: permDoc._id },
                    { $setOnInsert: { roleId: roleDoc._id, permissionId: permDoc._id } },
                    { upsert: true }
                );
            }
        }
        console.log("✔️ Role-Permission mappings synchronized.");

        console.log("🎉 RBAC Seeded Successfully!");
    } catch (error) {
        console.error("❌ Failed to seed RBAC:", error);
    }
};
