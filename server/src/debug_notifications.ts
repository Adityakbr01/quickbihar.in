import mongoose from "mongoose";
import connectDB from "./config/db";
import { Notification } from "./modules/notification/notification.model";
import { User } from "./modules/user/user.model";

async function run() {
  console.log("Connecting to database...");
  await connectDB();

  console.log("\n=== LATEST NOTIFICATION CAMPAIGNS ===");
  const latestCampaigns = await Notification.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  if (latestCampaigns.length === 0) {
    console.log("No campaigns found.");
  } else {
    for (const campaign of latestCampaigns) {
      console.log(`\nCampaign ID: ${campaign._id}`);
      console.log(`Title: ${campaign.title}`);
      console.log(`Status: ${campaign.status}`);
      console.log(`Delivery Type: ${campaign.deliveryType}`);
      console.log(`Target Type: ${campaign.targetType}`);
      if (campaign.targetRole) console.log(`Target Role: ${campaign.targetRole}`);
      if (campaign.targetUser) console.log(`Target User: ${campaign.targetUser}`);
      if (campaign.error) console.log(`Error: ${campaign.error}`);
    }
  }

  console.log("\n=== FCM TOKENS REGISTERED IN DATABASE ===");
  const totalUsers = await User.countDocuments({});
  const usersWithFcm = await User.countDocuments({ fcmToken: { $exists: true, $ne: "" } });
  console.log(`Total users in system: ${totalUsers}`);
  console.log(`Users with FCM token: ${usersWithFcm}`);

  if (usersWithFcm > 0) {
    const sampleUsers = await User.find({ fcmToken: { $exists: true, $ne: "" } })
      .select("fullName username roleId fcmToken")
      .limit(5)
      .lean();
    console.log("\nSample Users with FCM tokens:");
    for (const user of sampleUsers) {
      console.log(`- Name: ${user.fullName}, Role ID: ${user.roleId}, Token Prefix: ${user.fcmToken?.substring(0, 30)}...`);
    }
  }

  console.log("\nClosing database connection...");
  await mongoose.connection.close();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Debug script failed:", err);
  process.exit(1);
});
