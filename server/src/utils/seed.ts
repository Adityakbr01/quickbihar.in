import { User } from "../modules/user/user.model";
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
