import { SocketEvents } from "@/src/constants/socketEvents";
import axiosInstance from "@/src/api/axiosInstance";
import { socketClient } from "@/src/lib/socket";
import * as SecureStore from "expo-secure-store";
import React, { useEffect } from "react";
import { useCartStore } from "../features/Clothings/cart/store/cartStore";
import { useAuthStore } from "../features/common/auth/store/authStore";

export const SocketListenerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
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

    return () => {
      socketClient.off(SocketEvents.STOCK_UPDATE);
      socketClient.off(SocketEvents.FULFILLMENT_EVENT);
    };
  }, [handleStockUpdate]);

  return <>{children}</>;
};
