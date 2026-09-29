import { webNotifications as Notifications } from "@/src/lib/webNotifications";

export async function registerForPushNotificationsAsync() {
  // Web has no native push — real Web Push needs a service worker + backend.
  // Skip like before.
  console.log("[Notification] Skipping registration on web.");
  return;
}

/**
 * Lazy initialization of the notification handler.
 * Web build: no-op stub (same as before).
 */
export async function initializeNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  await Notifications.setNotificationCategoryAsync("PROMOTION_EXPLORE_MALL", [
    {
      identifier: "EXPLORE_MALL",
      buttonTitle: "Explore Mall",
      options: { opensAppToForeground: true },
    },
  ]);

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
