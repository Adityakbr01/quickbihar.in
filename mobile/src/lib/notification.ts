import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
  // Check if running in Expo Go (remote notifications removed in SDK 53+)
  if (Constants.appOwnership === "expo") {
    console.log("[Notification] Skipping registration in Expo Go.");
    return;
  }

  // ✅ Dynamic Import (CRITICAL FIX)
  const Notifications = await import("expo-notifications");

  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    await Notifications.setNotificationChannelAsync("promotions", {
      name: "Promotions",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.warn("Failed to get push token for push notification!");
    return;
  }

  if (Device.isDevice) {
    try {
      token = (await Notifications.getDevicePushTokenAsync()).data;
      console.log("[Notification] Direct FCM Device Token retrieved successfully");
    } catch (e) {
      console.error("[Notification] Error getting native device token:", e);
    }
  } else {
    console.log("[Notification] Simulator detected - permission requested but skipping FCM token retrieval");
  }

  return token;
}

/**
 * Lazy initialization of the notification handler.
 * Call this only in non-Expo-Go environments.
 */
export async function initializeNotificationHandler() {
  if (Constants.appOwnership === "expo") return;

  const Notifications = await import("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  await Notifications.setNotificationCategoryAsync("PROMOTION_BUY_NOW", [
    {
      identifier: "BUY_NOW",
      buttonTitle: "Buy Now",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync("PROMOTION_SHOP_NOW", [
    {
      identifier: "SHOP_NOW",
      buttonTitle: "Shop Now",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync("PROMOTION_VIEW_DETAILS", [
    {
      identifier: "VIEW_DETAILS",
      buttonTitle: "View Details",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync("PROMOTION_ORDER_NOW", [
    {
      identifier: "ORDER_NOW",
      buttonTitle: "Order Now",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync("PROMOTION_CLAIM_OFFER", [
    {
      identifier: "CLAIM_OFFER",
      buttonTitle: "Claim Offer",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync("PROMOTION_LEARN_MORE", [
    {
      identifier: "LEARN_MORE",
      buttonTitle: "Learn More",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync("PROMOTION_OPEN_LINK", [
    {
      identifier: "OPEN_LINK",
      buttonTitle: "Open Link",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync("PROMOTION_CHECK_IT_OUT", [
    {
      identifier: "CHECK_IT_OUT",
      buttonTitle: "Check It Out",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync("PROMOTION_VIEW_PRODUCT", [
    {
      identifier: "VIEW_PRODUCT",
      buttonTitle: "View Product",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync("PROMOTION_VIEW_ORDER", [
    {
      identifier: "VIEW_ORDER",
      buttonTitle: "View Order",
      options: { opensAppToForeground: true },
    },
  ]);
}
