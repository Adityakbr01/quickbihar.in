import { SocketEvents } from "@/src/constants/socketEvents";
import axiosInstance from "@/src/api/axiosInstance";
import { socketClient } from "@/src/lib/socket";
import { authStorage } from "@/src/lib/authStorage";
import React, { useEffect } from "react";
import * as Haptics from "@/lib/haptics";
import { useCartStore } from "../features/common/cart/store/cartStore";
import { useAuthStore } from "../features/common/auth/store/authStore";
import { useQueryClient } from "@tanstack/react-query";

export const SocketListenerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();
  const handleStockUpdate = useCartStore((state) => state.handleStockUpdate);
  const { token, isAuthenticated } = useAuthStore();

  const recoverFulfillmentEvents = async () => {
    try {
      const after = await authStorage.getItemAsync("lastFulfillmentEventId");
      const response = await axiosInstance.get("/events", { params: after ? { after } : { limit: 20 } });
      const events = response.data?.data || [];
      const last = events[events.length - 1];
      if (last?.eventId) {
        await authStorage.setItemAsync("lastFulfillmentEventId", last.eventId);
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
        await authStorage.setItemAsync("lastFulfillmentEventId", event.eventId);
      }
    });

    socketClient.on(SocketEvents.NEW_NOTIFICATION, (data) => {
      console.log("[SocketListener] New live notification received:", data);
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    });

    socketClient.on(SocketEvents.NOTIFICATION_UPDATED, async (data) => {
      console.log("[SocketListener] Notification updated event received:", data);
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });

      // OS-level persistent system notifications need a native runtime —
      // web build skips scheduling (same as before).

      // Haptic-only signal for live activity updates — the notification
      // list refreshes via query invalidation above, no toast/alert needed.
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    });

    return () => {
      socketClient.off(SocketEvents.STOCK_UPDATE);
      socketClient.off(SocketEvents.FULFILLMENT_EVENT);
      socketClient.off(SocketEvents.NEW_NOTIFICATION);
      socketClient.off(SocketEvents.NOTIFICATION_UPDATED);
    };
  }, [handleStockUpdate, queryClient]);

  return <>{children}</>;
};
