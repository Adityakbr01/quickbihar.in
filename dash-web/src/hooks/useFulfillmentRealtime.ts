import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { SocketEvents } from "@/constants/socketEvents";
import { getWebSocket } from "@/lib/socket";
import axiosInstance from "@/lib/axios";

const LAST_EVENT_KEY = "quickbihar:last-fulfillment-event-id";

const DEFAULT_KEYS = [
  ["admin-orders"],
  ["admin-delivery-riders"],
  ["seller-management"],
  ["delivery-profile"],
  ["delivery-dashboard"],
  ["delivery-orders"],
  ["delivery-history"],
  ["delivery-earnings"],
  ["delivery-payouts"],
];

export function useFulfillmentRealtime(queryKeys = DEFAULT_KEYS) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getWebSocket();
    if (!socket) return;

    const invalidateQueriesOnly = () => {
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    };

    const handleFulfillmentEvent = (event?: any) => {
      invalidateQueriesOnly();

      if (event?.eventId && typeof window !== "undefined") {
        window.localStorage.setItem(LAST_EVENT_KEY, event.eventId);
      }

      const message = event?.metadata?.message || event?.message;
      if (message) {
        const toastId = event?.eventId || event?.subOrderId || event?.orderId;
        toast.info(message, {
          id: toastId ? `fulfillment-${toastId}` : undefined,
          duration: 4000,
        });
      }
    };

    const handleOrderStatusUpdate = () => {
      // Invalidate queries only. SocketListenerProvider globally handles the user-facing toast.
      invalidateQueriesOnly();
    };

    const recoverMissedEvents = async () => {
      if (typeof window === "undefined") return;
      try {
        const after = window.localStorage.getItem(LAST_EVENT_KEY);
        const response = await axiosInstance.get("/events", { params: after ? { after } : { limit: 20 } });
        const events = response.data?.data || [];
        if (events.length > 0) {
          invalidateQueriesOnly();
          const latestEvent = events[events.length - 1];
          if (latestEvent?.eventId) {
            window.localStorage.setItem(LAST_EVENT_KEY, latestEvent.eventId);
          }
        }
      } catch {
        // Ignore recovery errors
      }
    };

    socket.on("connect", recoverMissedEvents);
    recoverMissedEvents().catch(() => undefined);

    socket.on(SocketEvents.FULFILLMENT_EVENT, handleFulfillmentEvent);
    socket.on(SocketEvents.ORDER_STATUS_UPDATE, handleOrderStatusUpdate);
    socket.on(SocketEvents.NEW_ORDER, invalidateQueriesOnly);
    socket.on(SocketEvents.ORDER_CONFIRMED, invalidateQueriesOnly);

    return () => {
      socket.off(SocketEvents.FULFILLMENT_EVENT, handleFulfillmentEvent);
      socket.off(SocketEvents.ORDER_STATUS_UPDATE, handleOrderStatusUpdate);
      socket.off(SocketEvents.NEW_ORDER, invalidateQueriesOnly);
      socket.off(SocketEvents.ORDER_CONFIRMED, invalidateQueriesOnly);
      socket.off("connect", recoverMissedEvents);
    };
  }, [queryClient, queryKeys]);
}
