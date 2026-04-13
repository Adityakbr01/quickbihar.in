import { User } from "../modules/user/user.model";
import { SizeChart } from "../modules/sizeChart/sizeChart.model";
import { ENV } from "../config/env.config";

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
        const existingChartsCount = await SizeChart.countDocuments();

        if (existingChartsCount === 0) {
            console.log("🌱 Seeding Common Size Charts...");

            const commonCharts = [
                {
                    name: "Men's Round Neck T-Shirt",
                    category: "T-Shirt",
                    unit: "inches",
                    fields: ["Size", "To Fit Chest (in)", "Front Length (in)", "Shoulder (in)"],
                    data: [
                        { size: "S", "To Fit Chest (in)": 38, "Front Length (in)": 27, "Shoulder (in)": 17 },
                        { size: "M", "To Fit Chest (in)": 40, "Front Length (in)": 28, "Shoulder (in)": 18 },
                        { size: "L", "To Fit Chest (in)": 42, "Front Length (in)": 29, "Shoulder (in)": 19 },
                        { size: "XL", "To Fit Chest (in)": 44, "Front Length (in)": 30, "Shoulder (in)": 20 },
                        { size: "XXL", "To Fit Chest (in)": 46, "Front Length (in)": 31, "Shoulder (in)": 21 },
                    ],
                    howToMeasure: [
                        "Chest: Measure around the fullest part of your chest.",
                        "Length: Measure from the highest point of the shoulder down.",
                        "Shoulder: Measure from one shoulder point to the other."
                    ]
                },
                {
                    name: "Men's Slim Fit Shirt",
                    category: "Shirt",
                    unit: "inches",
                    fields: ["Size", "Chest (in)", "Shoulder (in)", "Sleeve Length (in)", "Length (in)"],
                    data: [
                        { size: "38", "Chest (in)": 40, "Shoulder (in)": 18, "Sleeve Length (in)": 25, "Length (in)": 29 },
                        { size: "40", "Chest (in)": 42, "Shoulder (in)": 19, "Sleeve Length (in)": 26, "Length (in)": 30 },
                        { size: "42", "Chest (in)": 44, "Shoulder (in)": 20, "Sleeve Length (in)": 27, "Length (in)": 31 },
                        { size: "44", "Chest (in)": 46, "Shoulder (in)": 21, "Sleeve Length (in)": 28, "Length (in)": 32 },
                    ],
                    howToMeasure: [
                        "Chest: Measure around the fullest part of your chest.",
                        "Shoulder: Measure from one shoulder point to the other.",
                        "Sleeve: Measure from the shoulder point to the wrist."
                    ]
                },
                {
                    name: "Men's Regular Fit Jeans",
                    category: "Jeans",
                    unit: "inches",
                    fields: ["Size", "Waist (in)", "Hip (in)", "Thigh (in)", "Length (in)"],
                    data: [
                        { size: "30", "Waist (in)": 30, "Hip (in)": 38, "Thigh (in)": 22, "Length (in)": 40 },
                        { size: "32", "Waist (in)": 32, "Hip (in)": 40, "Thigh (in)": 23, "Length (in)": 41 },
                        { size: "34", "Waist (in)": 34, "Hip (in)": 42, "Thigh (in)": 24, "Length (in)": 42 },
                        { size: "36", "Waist (in)": 36, "Hip (in)": 44, "Thigh (in)": 25, "Length (in)": 43 },
                    ],
                    howToMeasure: [
                        "Waist: Measure around your natural waistline.",
                        "Hip: Measure around the fullest part of your hips.",
                        "Length: Measure from the crotch to the ankle."
                    ]
                }
            ];

            await SizeChart.insertMany(commonCharts);
            console.log("✅ Common Size Charts seeded successfully!");
        } else {
            console.log("ℹ️ Size Charts already exist, skipping seed.");
        }
    } catch (error) {
        console.error("❌ Failed to seed Size Charts:", error);
    }
};
