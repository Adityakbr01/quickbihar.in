import React, { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { webSocketClient } from "@/lib/socket";
import { SocketEvents } from "@/constants/socketEvents";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";

export default function SocketListenerProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      webSocketClient.disconnect();
      return;
    }

    // Connect to WebSocket server
    webSocketClient.connect(token);

    // Listen to real-time order status updates
    const handleOrderStatusUpdate = (data: { subOrderId: string; status: string; message: string }) => {
      console.log("[SocketListener] Received order status update:", data);
      
      // Premium visual notification
      toast.info(`Sub-Order Update: ${data.subOrderId}`, {
        description: data.message,
        duration: 5000,
      });

      // Invalidate relevant React Query caches to trigger automatic UI re-render
      queryClient.invalidateQueries({ queryKey: ["seller-management"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sub-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-profile"] });
    };

    // Listen to live delivery location updates
    const handleDeliveryLocationUpdate = (data: { subOrderId: string; latitude: number; longitude: number }) => {
      console.log("[SocketListener] Received location update:", data);

      // Invalidate sub-order detail query caches to update map components
      queryClient.invalidateQueries({ queryKey: ["seller-management", "sub-order", data.subOrderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-sub-order", data.subOrderId] });
    };

    // Listen to newly-created notifications (admin campaigns, system pushes).
    // Mirrors the mobile SocketListenerProvider: toast + refetch the admin
    // notification history/analytics caches so the dashboard updates live.
    const handleNewNotification = (data: { title?: string; description?: string; message?: string }) => {
      console.log("[SocketListener] New live notification received:", data);
      toast.info(data?.title || "New Notification", {
        description: data?.description || data?.message || "",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notification-analytics"] });
    };

    webSocketClient.on("order_status_update", handleOrderStatusUpdate);
    webSocketClient.on("delivery_location_updated", handleDeliveryLocationUpdate);
    webSocketClient.on(SocketEvents.NEW_NOTIFICATION, handleNewNotification);

    // Join room for the current logged-in user to receive personal push updates
    if (user?._id) {
      webSocketClient.emit("join_room", `user_${user._id}`);
    }

    return () => {
      webSocketClient.off("order_status_update", handleOrderStatusUpdate);
      webSocketClient.off("delivery_location_updated", handleDeliveryLocationUpdate);
      webSocketClient.off(SocketEvents.NEW_NOTIFICATION, handleNewNotification);
    };
  }, [token, user?._id, queryClient]);

  return <>{children}</>;
}
