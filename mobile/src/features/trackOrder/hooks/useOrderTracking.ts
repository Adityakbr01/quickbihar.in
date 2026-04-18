import { useState, useEffect, useCallback, useRef } from "react";
import { useSocketStore } from "@/src/store/useSocketStore";
import { SocketEvents } from "@/src/constants/socketEvents";
import { calculateDistance, calculateETA, calculateHeading } from "../utils/geoUtils";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface UseOrderTrackingProps {
  orderId: string;
  destination: LatLng;
  initialRiderLocation?: LatLng;
}

export const useOrderTracking = ({
  orderId,
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

  const handleLocationUpdate = useCallback(
    (data: any) => {
      console.log(`[useOrderTracking] Received location update for ${data.orderId}:`, data);
      // Server emits 'delivery_location_updated'
      if (data.orderId !== orderId) return;

      const newLocation: LatLng = {
        latitude: data.latitude,
        longitude: data.longitude,
      };

      // Calculate Metrics
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

      // Update State
      setRiderLocation(newLocation);
      setDistance(newDistance);
      setEta(newEta);
      if (newHeading !== 0) {
        setHeading(newHeading);
      }

      lastLocationRef.current = newLocation;
    },
    [orderId, destination]
  );

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log(`[useOrderTracking] Joining room for order: ${orderId}`);
    
    // Join Order Room (Server expects string orderId, not object)
    socket.emit(SocketEvents.JOIN_ORDER_ROOM, orderId);

    // Listen for rider updates
    socket.on(SocketEvents.DELIVERY_LOCATION_UPDATED, handleLocationUpdate);
    console.log(`[useOrderTracking] Listening for ${SocketEvents.DELIVERY_LOCATION_UPDATED}`);

    return () => {
      console.log(`[useOrderTracking] Leaving room: ${orderId}`);
      socket.emit(SocketEvents.LEAVE_ORDER_ROOM, orderId);
      socket.off(SocketEvents.DELIVERY_LOCATION_UPDATED, handleLocationUpdate);
    };
  }, [orderId, socket, isConnected, handleLocationUpdate]);

  return {
    riderLocation,
    distance,
    eta,
    heading,
  };
};
