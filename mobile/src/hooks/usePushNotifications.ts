import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerForPushNotificationsAsync, initializeNotificationHandler } from "../lib/notification";
import { updateFcmTokenRequest } from "../features/profileInfo/api/profile.api";
import { useAuthStore } from "../features/auth/store/authStore";

const HAS_ASKED_KEY = "has_asked_push_notifications";

export const usePushNotifications = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();

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

        // 2. Import Notifications Dynamically for permissions
        const Notifications = await import("expo-notifications");

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        const hasAskedPreviously = await SecureStore.getItemAsync(HAS_ASKED_KEY);
        
        let finalStatus = existingStatus;

        if (existingStatus !== "granted" && !hasAskedPreviously) {
          console.log("[usePushNotifications] First time ask - Prompting user");
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          await SecureStore.setItemAsync(HAS_ASKED_KEY, "true");
        }

        if (finalStatus === "granted") {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await updateFcmTokenRequest(token);
          }
        }
      } catch (error: any) {
        console.log("[usePushNotifications] Setup skipped:", error.message);
      }
    };

    setupNotifications();
  }, [isAuthenticated, isInitialized]);
};