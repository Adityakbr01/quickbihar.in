import { useEffect } from "react";
import { Linking } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerForPushNotificationsAsync, initializeNotificationHandler } from "../lib/notification";
import { useAuthStore } from "../features/common/auth/store/authStore";
import { updateFcmTokenRequest } from "../features/Clothings/profileInfo/api/profile.api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

const HAS_ASKED_KEY = "has_asked_push_notifications";

export const usePushNotifications = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let subscription: any;
    let responseSubscription: any;

    const registerListener = async () => {
      try {
        const Notifications = await import("expo-notifications");
        subscription = Notifications.addNotificationReceivedListener((notification) => {
          console.log("[usePushNotifications] Foreground notification received:", notification);
          queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
        });

        responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("[usePushNotifications] Notification clicked/interacted:", response);
          const data = response?.notification?.request?.content?.data;
          const actionIdentifier = response.actionIdentifier;

          if (data) {
            const { redirectType, redirectId, externalUrl, deepLink } = data as {
              redirectType?: string;
              redirectId?: string;
              externalUrl?: string;
              deepLink?: string;
            };
            console.log(`[usePushNotifications] Handling click redirect: type=${redirectType}, id=${redirectId}, url=${externalUrl}, deepLink=${deepLink}, action=${actionIdentifier}`);
            
            const promoActions = [
              "BUY_NOW",
              "SHOP_NOW",
              "VIEW_DETAILS",
              "ORDER_NOW",
              "CLAIM_OFFER",
              "LEARN_MORE",
              "OPEN_LINK",
              "CHECK_IT_OUT",
              "VIEW_PRODUCT",
              "VIEW_ORDER",
              "EXPLORE_MALL"
            ];
            const isPromoAction = promoActions.includes(actionIdentifier);
            if (isPromoAction || actionIdentifier === "default") {
              const fallbackRouting = () => {
                if (redirectType === "product" && redirectId) {
                  router.push(`/product/${redirectId}` as any);
                } else if (redirectType === "category" && redirectId) {
                  router.push(`/mall` as any);
                } else if (redirectType === "mall" && redirectId) {
                  router.push(`/mall/${redirectId}` as any);
                } else if (redirectType === "external" && externalUrl) {
                  import("expo-web-browser").then((WebBrowser) => {
                    WebBrowser.openBrowserAsync(externalUrl);
                  });
                }
              };

              if (deepLink) {
                Linking.canOpenURL(deepLink).then((supported) => {
                  if (supported) {
                    Linking.openURL(deepLink).catch((err) => {
                      console.error("[usePushNotifications] Failed to open deepLink, using local routing:", err);
                      fallbackRouting();
                    });
                  } else {
                    console.warn("[usePushNotifications] Deep link scheme not supported locally, using local routing:", deepLink);
                    fallbackRouting();
                  }
                });
                return;
              }

              // Fallback to legacy app routing directly if no deepLink
              fallbackRouting();
            }
          }
        });
      } catch (err) {
        console.warn("[usePushNotifications] Failed to register notification listener:", err);
      }
    };

    registerListener();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (responseSubscription) {
        responseSubscription.remove();
      }
    };
  }, [queryClient, router]);

  useEffect(() => {
    if (!isInitialized) return;

    const isExpoGo = Constants.appOwnership === "expo";
    if (isExpoGo) {
      console.log("🚫 Push notifications disabled in Expo Go (SDK 53 Compatibility Mode)");
      return;
    }

    const setupNotifications = async () => {
      try {
        // 1. Initialize Handler (Lazy)
        await initializeNotificationHandler();

        // 2. Register & request permission (handles prompts automatically)
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await updateFcmTokenRequest(token);
        }
      } catch (error: any) {
        console.log("[usePushNotifications] Setup skipped:", error.message);
      }
    };

    setupNotifications();
  }, [isAuthenticated, isInitialized]);
};