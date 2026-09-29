import { useEffect } from "react";
import { registerForPushNotificationsAsync, initializeNotificationHandler } from "../lib/notification";
import { useAuthStore } from "../features/common/auth/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";

export const usePushNotifications = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    let subscription: any;
    let responseSubscription: any;

    const registerListener = async () => {
      try {
        // Web build: no native push runtime — listeners are a no-op.
        return;
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
  }, [queryClient, navigate]);

  useEffect(() => {
    if (!isInitialized) return;

    const setupNotifications = async () => {
      try {
        // Web build: no native push runtime — setup is a no-op.
        await initializeNotificationHandler();
        await registerForPushNotificationsAsync();
      } catch (error: any) {
        console.log("[usePushNotifications] Setup skipped:", error.message);
      }
    };

    setupNotifications();
  }, [isAuthenticated, isInitialized]);
};
