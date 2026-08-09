import mongoose from "mongoose";
import { ENV } from "../config/env.config";
import { User } from "../modules/common/user/user.model";
import { Seller } from "../modules/common/seller/seller.model";
import { DeliveryBoy } from "../modules/common/deliveryBoy/delivery.model";
import { Order } from "../modules/common/order/order.model";
import { SubOrder } from "../modules/common/order/subOrder.model";
import { Cart } from "../modules/common/cart/cart.model";
import { Wishlist } from "../modules/common/wishlist/wishlist.model";
import { SavedAddress } from "../modules/common/savedAddress/savedAddresses.model";
import { Application } from "../modules/common/onboarding/onboarding.model";
import { ReturnRequest } from "../modules/common/fulfillment/returnRequest.model";
import { RiderOffer } from "../modules/common/fulfillment/riderOffer.model";
import { CodSettlement } from "../modules/common/fulfillment/codSettlement.model";
import { FulfillmentEvent } from "../modules/common/fulfillment/fulfillmentEvent.model";
import { NotificationOutbox } from "../modules/common/fulfillment/notificationOutbox.model";
import {
  SellerEarning,
  InventoryMovement,
  SellerNotification,
  SellerCategoryRequest,
} from "../modules/common/seller/sellerPanel.model";
import { Notification } from "../modules/common/notification/notification.model";
import { NotificationRead } from "../modules/common/notification/notificationRead.model";
import { NotificationTrack } from "../modules/common/notification/notificationTrack.model";
import { DeviceToken } from "../modules/common/notification/deviceToken.model";
import { ActivityLog, AuditLog } from "../modules/common/admin/adminFull.model";
import { Product } from "../modules/clothing/products/product.model";
import { Category } from "../modules/common/category/category.model";
import { Banner } from "../modules/common/banner/banner.model";
import { Coupon } from "../modules/common/coupon/coupon.model";
import {
  seedRbac,
  seedAdmin,
  seedAppConfig,
  seedRefundPolicies,
  seedSizeCharts,
} from "../seed/seed";

async function cleanDatabase() {
  console.log("🧹 Starting Database Clean & Reset process...");

  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

    console.log("\n🗑️ Deleting test transactional and entity data...");

    await Promise.all([
      Order.deleteMany({}),
      SubOrder.deleteMany({}),
      ReturnRequest.deleteMany({}),
      RiderOffer.deleteMany({}),
      CodSettlement.deleteMany({}),
      FulfillmentEvent.deleteMany({}),
      NotificationOutbox.deleteMany({}),

      Seller.deleteMany({}),
      SellerEarning.deleteMany({}),
      InventoryMovement.deleteMany({}),
      SellerNotification.deleteMany({}),
      SellerCategoryRequest.deleteMany({}),

      DeliveryBoy.deleteMany({}),
      Application.deleteMany({}),

      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
      SavedAddress.deleteMany({}),

      Notification.deleteMany({}),
      NotificationRead.deleteMany({}),
      NotificationTrack.deleteMany({}),
      DeviceToken.deleteMany({}),

      ActivityLog.deleteMany({}),
      AuditLog.deleteMany({}),

      Product.deleteMany({}),
      Category.deleteMany({}),
      Banner.deleteMany({}),
      Coupon.deleteMany({}),

      // Delete non-admin users so admin can be cleanly re-seeded
      User.deleteMany({ email: { $ne: ENV.ADMIN_EMAIL } }),
    ]);

    console.log("✨ All transactional and entity records deleted successfully.");

    console.log("\n🌱 Re-seeding mandatory system defaults (RBAC, Admin, Config, Policies, Size Charts)...");
    await seedRbac();
    await seedAdmin();
    await seedAppConfig();
    await seedRefundPolicies();
    await seedSizeCharts();

    console.log("\n🎉 Database reset & system seeding completed successfully!");
    console.log("👉 System Admin is ready:", ENV.ADMIN_EMAIL);
    console.log("👉 You can now run end-to-end tests from scratch.");
  } catch (error) {
    console.error("❌ Critical error during database clean:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

cleanDatabase();
