import { useState, useEffect, useCallback, useRef } from "react";
import { useSocketStore } from "@/src/store/useSocketStore";
import { SocketEvents } from "@/src/constants/socketEvents";
import { calculateDistance, calculateETA, calculateHeading } from "../utils/geoUtils";
import { getOrderByIdRequest } from "@/src/features/common/order/api/order.api";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface UseOrderTrackingProps {
  orderId: string;
  subOrderId?: string;
  destination: LatLng;
  initialRiderLocation?: LatLng;
}

export const useOrderTracking = ({
  orderId,
  subOrderId,
  destination,
  initialRiderLocation,
}: UseOrderTrackingProps) => {
  const { socket, isConnected } = useSocketStore();
  const [riderLocation, setRiderLocation] = useState<LatLng | null>(
    initialRiderLocation || null
  );
  const [distance, setDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);

  const lastLocationRef = useRef<LatLng | null>(initialRiderLocation || null);
  const lastUpdateTimestampRef = useRef<number>(Date.now());

  // Update position, recalculate distance, heading, and ETA
  const updateLocationData = useCallback(
    (newLocation: LatLng) => {
      const newDistance = calculateDistance(
        newLocation.latitude,
        newLocation.longitude,
        destination.latitude,
        destination.longitude
      );

      const newEta = calculateETA(newDistance);

      const newHeading = lastLocationRef.current
        ? calculateHeading(lastLocationRef.current, newLocation)
        : 0;

      setRiderLocation(newLocation);
      setDistance(newDistance);
      setEta(newEta);
      if (newHeading !== 0) {
        setHeading(newHeading);
      }

      lastLocationRef.current = newLocation;
      lastUpdateTimestampRef.current = Date.now();
    },
    [destination]
  );

  // 1. WebSocket Realtime Subscription
  useEffect(() => {
    if (!socket || !isConnected) return;

    if (subOrderId) {
      socket.emit("join_suborder_room", subOrderId);

      const handleSubOrderLocation = (data: any) => {
        if (data.subOrderId !== subOrderId) return;
        updateLocationData({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      };

      socket.on("delivery_location_updated", handleSubOrderLocation);

      return () => {
        socket.emit("leave_suborder_room", subOrderId);
        socket.off("delivery_location_updated", handleSubOrderLocation);
      };
    } else if (orderId) {
      socket.emit(SocketEvents.JOIN_ORDER_ROOM, orderId);

      const handleLocationUpdate = (data: any) => {
        if (data.orderId !== orderId) return;
        updateLocationData({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      };

      socket.on(SocketEvents.DELIVERY_LOCATION_UPDATED, handleLocationUpdate);

      return () => {
        socket.emit(SocketEvents.LEAVE_ORDER_ROOM, orderId);
        socket.off(SocketEvents.DELIVERY_LOCATION_UPDATED, handleLocationUpdate);
      };
    }
  }, [orderId, subOrderId, socket, isConnected, updateLocationData]);

  // 2. Resilient Fallback: HTTP polling if socket disconnects or no update in 15 seconds
  useEffect(() => {
    const fallbackInterval = setInterval(async () => {
      const timeSinceLastUpdate = Date.now() - lastUpdateTimestampRef.current;
      // If socket is disconnected OR no update received in over 15 seconds
      if (!isConnected || timeSinceLastUpdate > 15000) {
        try {
          if (orderId) {
            const res = await getOrderByIdRequest(orderId);
            const orderData = res?.data || res;
            
            // Check subOrder or order delivery location
            let loc: any = null;
            if (subOrderId && orderData?.subOrders) {
              const matched = orderData.subOrders.find((s: any) => s.subOrderId === subOrderId);
              loc = matched?.delivery?.currentLocation;
            } else {
              loc = orderData?.delivery?.currentLocation;
            }

            if (loc && loc.latitude && loc.longitude) {
              updateLocationData({
                latitude: loc.latitude,
                longitude: loc.longitude,
              });
            }
          }
        } catch {
          // Ignore network errors in polling
        }
      }
    }, 12000);

    return () => clearInterval(fallbackInterval);
  }, [orderId, subOrderId, isConnected, updateLocationData]);

  return {
    riderLocation,
    distance,
    eta,
    heading,
  };
};
