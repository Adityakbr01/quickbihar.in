import { useEffect } from "react";
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
          if (data) {
            const { redirectType, redirectId, externalUrl } = data;
            console.log(`[usePushNotifications] Handling click redirect: type=${redirectType}, id=${redirectId}, url=${externalUrl}`);
            
            if (redirectType === "product" && redirectId) {
              router.push(`/product/${redirectId}` as any);
            } else if (redirectType === "category" && redirectId) {
              router.push(`/mall` as any);
            } else if (redirectType === "external" && externalUrl) {
              import("expo-web-browser").then((WebBrowser) => {
                WebBrowser.openBrowserAsync(externalUrl);
              });
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
    if (!isInitialized || !isAuthenticated) return;

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