import mongoose from "mongoose";
import { User } from "../modules/common/user/user.model";
import { Role, Permission, RolePermission } from "../modules/common/rbac/rbac.model";
import { ROLES, PERMISSIONS } from "../modules/common/rbac/rbac.constants";
import { ROLE_PERMISSION_MAP } from "../modules/common/rbac/ROLE_PERMISSION_MAP";
import { AppConfig } from "../modules/common/appConfig/appConfig.model";
import { RefundPolicy } from "../modules/common/refundPolicy/refundPolicy.model";
import { SizeChart } from "../modules/clothing/sizeChart/sizeChart.model";
import { ENV } from "../config/env.config";

const MONGODB_URI = "mongodb://aditykbr01:pZyXlQPVhGCKLKRl@cluster0-shard-00-00.whbog.mongodb.net:27017,cluster0-shard-00-01.whbog.mongodb.net:27017,cluster0-shard-00-02.whbog.mongodb.net:27017/quickbihar?ssl=true&authSource=admin&replicaSet=atlas-y08dky-shard-0";

async function runEssentialSeed() {
  console.log("=================================================");
  console.log("🚀 STARTING ESSENTIAL SYSTEM SEEDING (ULTRA FAST)");
  console.log("=================================================");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas [quickbihar]");

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not established");

    // 1. CLEAN COLLECTIONS
    console.log("\n🧹 Cleaning up old collections for fresh start...");
    const collectionsToClean = [
      "users", "roles", "permissions", "rolepermissions", "appconfigs",
      "categories", "banners", "sizecharts", "refundpolicies", "orders",
      "suborders", "products", "stores", "deliveryboys", "devicetokens",
      "carts", "wishlists", "coupons", "savedaddresses", "sellernotifications",
      "sellerearnings", "rideroffers", "fulfillmentevents", "notificationoutboxes",
      "clothingstoreconfigs", "backupjobs", "faqs", "userroles", "jewelrystoreconfigs"
    ];

    for (const col of collectionsToClean) {
      try {
        await db.collection(col).deleteMany({});
      } catch (e) {}
    }
    console.log("✅ Database collections cleaned!");

    // 2. SEED RBAC ROLES & PERMISSIONS
    console.log("\n🔐 1. Seeding RBAC Roles & Permissions...");
    const roleDocs = Object.values(ROLES).map(roleName => ({
      name: roleName,
      isActive: true,
      description: `System role for ${roleName}`,
    }));
    await Role.insertMany(roleDocs);

    const permDocs = Object.values(PERMISSIONS).map(p => ({
      code: p.code,
      module: p.module,
      description: p.description,
      domain: (p as any).domain || "GLOBAL",
    }));
    await Permission.insertMany(permDocs);

    // Preload into Memory Map
    const allRoles = await Role.find().lean();
    const allPerms = await Permission.find().lean();
    const roleMap = new Map(allRoles.map(r => [r.name, r._id]));
    const permMap = new Map(allPerms.map(p => [p.code, p._id]));

    const rolePermDocs: any[] = [];
    const seenCombos = new Set<string>();

    for (const [roleName, permissionsList] of Object.entries(ROLE_PERMISSION_MAP)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) continue;

      for (const permCode of permissionsList) {
        const permId = permMap.get(permCode);
        if (!permId) continue;

        const key = `${roleId}_${permId}`;
        if (!seenCombos.has(key)) {
          seenCombos.add(key);
          rolePermDocs.push({
            roleId,
            permissionId: permId,
          });
        }
      }
    }

    if (rolePermDocs.length > 0) {
      await RolePermission.insertMany(rolePermDocs);
    }
    console.log(`✅ RBAC System initialized: ${allRoles.length} Roles, ${allPerms.length} Permissions, ${rolePermDocs.length} Role-Permission Links!`);

    // 3. SEED ADMIN USER
    console.log("\n👑 2. Seeding Admin User...");
    const adminRoleId = roleMap.get("ADMIN");
    if (!adminRoleId) throw new Error("ADMIN role not found.");

    const adminEmail = ENV.ADMIN_EMAIL || "admin@quickbihar.in";
    const adminPassword = ENV.ADMIN_PASSWORD || "admin123";

    const admin = await User.create({
      username: "admin",
      email: adminEmail,
      password: adminPassword, // will be auto-hashed by userSchema.pre('save')
      fullName: "Quick Bihar Administrator",
      phone: "9876543210",
      roleId: adminRoleId,
      isVerified: true,
      isBlocked: false,
    });

    const isPassOk = await admin.isPasswordCorrect(adminPassword);
    console.log(`✅ Admin Created: ${adminEmail} (Password Check: ${isPassOk ? "VERIFIED SUCCESS" : "FAILED"})`);

    // 4. SEED APP CONFIGURATION
    console.log("\n⚙️ 3. Seeding App Configuration...");
    const appConfigData = {
      policies: {
        privacyPolicy: "Quick Bihar respects your privacy. All your data is encrypted and secure.",
        termsAndConditions: "Standard terms and conditions for Quick Bihar shopping and delivery services in Bihar.",
        returnPolicy: "7 Days Easy & Hassle-free Return Policy across Bihar.",
        shippingPolicy: "Standard and express delivery across Bihar.",
      },
      contact: {
        email: "support@quickbihar.in",
        phone: "+91 9876543210",
        whatsapp: "+91 9876543210",
        address: "Patna, Bihar - 800001",
      },
      socialLinks: {
        facebook: "https://facebook.com/quickbihar",
        instagram: "https://instagram.com/quickbihar",
        twitter: "https://twitter.com/quickbihar",
        youtube: "https://youtube.com/quickbihar",
      },
      seo: {
        metaTitle: "Quick Bihar - Premium E-Commerce & Fast Delivery in Bihar",
        metaDescription: "The best shopping and delivery experience in Bihar.",
        keywords: ["shopping", "ecommerce", "bihar", "quickbihar", "patna"],
      },
      shipping: {
        freeShippingThreshold: 999,
        shippingFee: 40,
      },
      appearance: {
        logoUrl: "",
        faviconUrl: "",
      },
      marketplace: {
        commissionPercent: ENV.MARKETPLACE_COMMISSION_PERCENT || 10,
      },
      delivery: {
        defaultRadiusKm: 10,
        minOrderAmount: 0,
        estimatedMinutes: 45,
        riderPayoutAmount: 40,
        riderPayoutRules: {
          upto3Km: ENV.RIDER_PAYOUT_UPTO_3_KM || 30,
          upto5Km: ENV.RIDER_PAYOUT_UPTO_5_KM || 45,
          upto8Km: ENV.RIDER_PAYOUT_UPTO_8_KM || 65,
          extraPerKmAfter8: ENV.RIDER_PAYOUT_EXTRA_PER_KM_AFTER_8 || 10,
          rainBonus: ENV.RIDER_PAYOUT_RAIN_BONUS || 20,
          peakBonus: ENV.RIDER_PAYOUT_PEAK_BONUS || 15,
          festivalBonus: ENV.RIDER_PAYOUT_FESTIVAL_BONUS || 25,
          nightBonus: ENV.RIDER_PAYOUT_NIGHT_BONUS || 20,
        },
        bonusRules: {
          rainBonus: ENV.RIDER_PAYOUT_RAIN_BONUS || 20,
          peakBonus: ENV.RIDER_PAYOUT_PEAK_BONUS || 15,
          festivalBonus: ENV.RIDER_PAYOUT_FESTIVAL_BONUS || 25,
          nightBonus: ENV.RIDER_PAYOUT_NIGHT_BONUS || 20,
          rainMode: "AUTO" as const,
          peakMode: "AUTO" as const,
          festivalMode: "AUTO" as const,
          nightMode: "AUTO" as const,
          peakWindows: [{ start: "18:00", end: "21:00" }],
          festivalWindows: [],
          nightStart: "22:00",
          nightEnd: "06:00",
        },
      },
    };

    await AppConfig.create(appConfigData);
    console.log("✅ App Configuration seeded!");

    // 5. SEED STANDARD SIZE CHARTS
    console.log("\n📐 4. Seeding Standard Size Charts (Men, Women, Kids)...");
    const commonCharts = [
      {
        name: "Men's T-Shirt Size Chart",
        description: "Standard Men's T-Shirt size chart (S to XXL) covering Chest, Length, and Shoulder measurements.",
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
          "Chest: Measure around the fullest part of your chest.",
          "Shoulder: Measure from one shoulder tip to the other across the back.",
          "Length: Measure from highest point of shoulder down to bottom hem."
        ]
      },
      {
        name: "Men's Formal & Casual Shirt Size Chart",
        description: "Standard Men's Shirt sizes (38 to 46) mapping collar neck size, chest, shoulder, sleeve, and length.",
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
          "Collar/Neck: Measure around base of neck.",
          "Chest: Measure around fullest part of chest."
        ]
      },
      {
        name: "Men's Jeans & Trousers Size Chart",
        description: "Men's bottomwear size chart (30 to 40) for jeans, chinos, and trousers.",
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
          "Waist: Measure around natural waistline.",
          "Inseam: Measure from crotch to ankle bone."
        ]
      },
      {
        name: "Women's Kurti & Top Size Chart",
        description: "Standard Women's Kurti and Topwear sizes (XS to XXL) covering bust, waist, and shoulder.",
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
          "Bust: Measure around fullest part of bust.",
          "Waist: Measure around narrowest part of waist."
        ]
      },
      {
        name: "Women's Jeans & Bottomwear Size Chart",
        description: "Women's bottomwear sizes (26 to 36) mapping waist, hips, and outseam length.",
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
          "Waist: Measure around waist.",
          "Hip: Measure around fullest part of hips."
        ]
      },
      {
        name: "Men's Footwear (Shoes) Size Chart",
        description: "Standard Indian/UK shoe sizes for Men (UK 6 to UK 11) with foot length in cm.",
        category: "Men",
        unit: "cm",
        fields: ["Size", "US Size", "EU Size", "Foot Length (cm)"],
        data: [
          { size: "UK 6", "US Size": "7", "EU Size": "40", "Foot Length (cm)": 25.4 },
          { size: "UK 7", "US Size": "8", "EU Size": "41", "Foot Length (cm)": 26.3 },
          { size: "UK 8", "US Size": "9", "EU Size": "42", "Foot Length (cm)": 27.2 },
          { size: "UK 9", "US Size": "10", "EU Size": "43", "Foot Length (cm)": 28.0 },
          { size: "UK 10", "US Size": "11", "EU Size": "44.5", "Foot Length (cm)": 28.9 },
          { size: "UK 11", "US Size": "12", "EU Size": "46", "Foot Length (cm)": 29.8 },
        ],
        howToMeasure: [
          "Foot Length: Measure heel to longest toe distance."
        ]
      },
      {
        name: "Women's Footwear Size Chart",
        description: "Standard Indian/UK shoe sizes for Women (UK 3 to UK 8) with foot length in cm.",
        category: "Women",
        unit: "cm",
        fields: ["Size", "US Size", "EU Size", "Foot Length (cm)"],
        data: [
          { size: "UK 3", "US Size": "5", "EU Size": "36", "Foot Length (cm)": 22.8 },
          { size: "UK 4", "US Size": "6", "EU Size": "37", "Foot Length (cm)": 23.7 },
          { size: "UK 5", "US Size": "7", "EU Size": "38", "Foot Length (cm)": 24.5 },
          { size: "UK 6", "US Size": "8", "EU Size": "39", "Foot Length (cm)": 25.4 },
          { size: "UK 7", "US Size": "9", "EU Size": "40", "Foot Length (cm)": 26.2 },
          { size: "UK 8", "US Size": "10", "EU Size": "41", "Foot Length (cm)": 27.0 },
        ],
        howToMeasure: [
          "Foot Length: Measure heel to big toe distance."
        ]
      }
    ];

    await SizeChart.insertMany(commonCharts);
    console.log(`✅ ${commonCharts.length} Standard Size Charts seeded!`);

    // 6. SEED STANDARD REFUND & RETURN POLICIES
    console.log("\n📜 5. Seeding Refund, Return & Shipping Policies...");
    const commonPolicies = [
      {
        name: "7-Day Easy Return",
        policyType: "RETURN",
        category: "General",
        description: "Return within 7 days for products in original condition with tags.",
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
        description: "Replacement available for defective or damaged items, no refund.",
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
        name: "Full Refund (Original Payment)",
        policyType: "REFUND",
        category: "General",
        description: "Full refund to original payment method within 5-7 days after pickup verification.",
        refundProcessingDays: 5,
        conditions: ["Eligible after successful return validation."],
        isActive: true,
      },
      {
        name: "Instant Store Credit Refund",
        policyType: "REFUND",
        category: "General",
        description: "Refund as store wallet balance credited within 24 hours.",
        refundProcessingDays: 1,
        conditions: ["Can be used immediately for any future purchase."],
        isActive: true,
      },
      {
        name: "Standard Shipping Policy",
        policyType: "SHIPPING",
        category: "General",
        description: "Standard delivery across Bihar.",
        conditions: [
          "Free shipping on orders above ₹999",
          "Delivery within 2 to 4 business days",
          "Live SMS/WhatsApp tracking provided"
        ],
        isActive: true,
      },
      {
        name: "Terms of Service",
        policyType: "TERMS",
        category: "General",
        description: "Terms and conditions for purchase on Quick Bihar.",
        conditions: [
          "Prices are inclusive of applicable taxes",
          "Orders can be cancelled before dispatch"
        ],
        isActive: true,
      }
    ];

    await RefundPolicy.insertMany(commonPolicies);
    console.log(`✅ ${commonPolicies.length} Standard Policies seeded!`);

    console.log("\n=================================================");
    console.log("🎉 ESSENTIAL SYSTEM SEEDING COMPLETED 100%!");
    console.log("=================================================");
  } catch (error) {
    console.error("❌ Essential seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

runEssentialSeed();
