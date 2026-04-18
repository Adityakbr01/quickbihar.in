import React, { useEffect } from 'react';
import { socketClient } from '@/src/lib/socket';
import { SocketEvents } from '@/src/constants/socketEvents';
import { useCartStore } from '@/src/features/cart/store/cartStore';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import Toast from 'react-native-toast-message';

export const SocketListenerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handleStockUpdate = useCartStore((state) => state.handleStockUpdate);
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log("[SocketListener] Authenticated - Connecting Socket...");
      socketClient.connect(token);
    } else {
      console.log("[SocketListener] Not Authenticated - Disconnecting Socket...");
      socketClient.disconnect();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    // 1. Global Stock Listener
    socketClient.on(SocketEvents.STOCK_UPDATE, (data) => {
      console.log(`[SocketListener] Stock Update: ${data.sku} -> ${data.newStock}`);
      
      // Update Cart Store
      handleStockUpdate(data);

      // Opt-in: Show toast if stock is gone (optional/can be noisy, but good for Cart)
      if (data.newStock <= 0) {
        // We could check if it's in cart first, but toast might be good regardless
        // for products "Recently viewed" or in "Watchlist" (future)
      }
    });

    return () => {
      socketClient.off(SocketEvents.STOCK_UPDATE);
    };
  }, [handleStockUpdate]);

  return <>{children}</>;
};
