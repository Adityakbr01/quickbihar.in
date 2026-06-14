import { SocketEvents } from "@/src/constants/socketEvents";
import axiosInstance from "@/src/api/axiosInstance";
import { socketClient } from "@/src/lib/socket";
import * as SecureStore from "expo-secure-store";
import React, { useEffect } from "react";
import { useCartStore } from "../features/Clothings/cart/store/cartStore";
import { useAuthStore } from "../features/common/auth/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export const SocketListenerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const handleStockUpdate = useCartStore((state) => state.handleStockUpdate);
  const { token, isAuthenticated } = useAuthStore();

  const recoverFulfillmentEvents = async () => {
    try {
      const after = await SecureStore.getItemAsync("lastFulfillmentEventId");
      const response = await axiosInstance.get("/events", { params: after ? { after } : { limit: 20 } });
      const events = response.data?.data || [];
      const last = events[events.length - 1];
      if (last?.eventId) {
        await SecureStore.setItemAsync("lastFulfillmentEventId", last.eventId);
      }
      if (events.length) {
        console.log(`[SocketListener] Recovered ${events.length} fulfillment events`);
      }
    } catch (error) {
      console.log("[SocketListener] Fulfillment recovery skipped");
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log("[SocketListener] Authenticated - Connecting Socket...");
      socketClient.connect(token);
      recoverFulfillmentEvents();
    } else {
      console.log(
        "[SocketListener] Not Authenticated - Disconnecting Socket...",
      );
      socketClient.disconnect();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    // 1. Global Stock Listener
    socketClient.on(SocketEvents.STOCK_UPDATE, (data) => {
      console.log(
        `[SocketListener] Stock Update: ${data.sku} -> ${data.newStock}`,
      );

      // Update Cart Store
      handleStockUpdate(data);

      // Opt-in: Show toast if stock is gone (optional/can be noisy, but good for Cart)
      if (data.newStock <= 0) {
        // We could check if it's in cart first, but toast might be good regardless
        // for products "Recently viewed" or in "Watchlist" (future)
      }
    });

    socketClient.on(SocketEvents.FULFILLMENT_EVENT, async (event) => {
      if (event?.eventId) {
        await SecureStore.setItemAsync("lastFulfillmentEventId", event.eventId);
      }
    });

    socketClient.on(SocketEvents.NEW_NOTIFICATION, (data) => {
      console.log("[SocketListener] New live notification received:", data);
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      Toast.show({
        type: "info",
        text1: data?.title || "New Notification",
        text2: data?.description || "",
      });
    });

    socketClient.on(SocketEvents.NOTIFICATION_UPDATED, async (data) => {
      console.log("[SocketListener] Notification updated event received:", data);
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });

      // Trigger OS-level persistent system notification
      try {
        const Notifications = await import("expo-notifications");
        const activeStatuses = ["PENDING", "PROCESSING", "SENT"];
        const isOngoing = activeStatuses.includes(data.status || "");
        const notificationId = data.notificationId || data._id;

        if (notificationId) {
          if (isOngoing) {
            // Present persistent ongoing system notification on Android/iOS lock screens / status bars
            await Notifications.scheduleNotificationAsync({
              identifier: notificationId,
              content: {
                title: data.title || "Live Activity",
                body: data.description || "",
                data: data,
              },
              trigger: null,
            });
          } else {
            // Dismiss the persistent sticky notification
            await Notifications.dismissNotificationAsync(notificationId);

            // Present a final normal notification that can be swiped away by the user
            await Notifications.scheduleNotificationAsync({
              identifier: notificationId,
              content: {
                title: data.title || "Live Activity Complete",
                body: data.description || "",
                data: data,
              },
              trigger: null,
            });
          }
        }
      } catch (err) {
        console.warn("[SocketListener] Failed to schedule local persistent notification:", err);
      }

      Toast.show({
        type: "success",
        text1: data?.title || "Live Activity Update",
        text2: data?.description || "",
      });
    });

    return () => {
      socketClient.off(SocketEvents.STOCK_UPDATE);
      socketClient.off(SocketEvents.FULFILLMENT_EVENT);
      socketClient.off(SocketEvents.NEW_NOTIFICATION);
      socketClient.off(SocketEvents.NOTIFICATION_UPDATED);
    };
  }, [handleStockUpdate, queryClient, router]);

  return <>{children}</>;
};
