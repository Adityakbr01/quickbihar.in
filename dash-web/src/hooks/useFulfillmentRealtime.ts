"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

    const invalidate = (event?: any) => {
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });

      if (event?.eventId && typeof window !== "undefined") {
        window.localStorage.setItem(LAST_EVENT_KEY, event.eventId);
      }

      const message = event?.metadata?.message || event?.message;
      if (message) toast.info(message);
    };

    const recoverMissedEvents = async () => {
      if (typeof window === "undefined") return;
      const after = window.localStorage.getItem(LAST_EVENT_KEY);
      const response = await axiosInstance.get("/events", { params: after ? { after } : { limit: 20 } });
      const events = response.data?.data || [];
      events.forEach(invalidate);
    };

    socket.on("connect", recoverMissedEvents);
    recoverMissedEvents().catch(() => undefined);

    socket.on(SocketEvents.FULFILLMENT_EVENT, invalidate);
    socket.on(SocketEvents.ORDER_STATUS_UPDATE, invalidate);
    socket.on(SocketEvents.NEW_ORDER, invalidate);
    socket.on(SocketEvents.ORDER_CONFIRMED, invalidate);

    return () => {
      socket.off(SocketEvents.FULFILLMENT_EVENT, invalidate);
      socket.off(SocketEvents.ORDER_STATUS_UPDATE, invalidate);
      socket.off(SocketEvents.NEW_ORDER, invalidate);
      socket.off(SocketEvents.ORDER_CONFIRMED, invalidate);
      socket.off("connect", recoverMissedEvents);
    };
  }, [queryClient, queryKeys]);
}
