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

  const handleLocationUpdate = useCallback(
    (data: any) => {
      console.log(`[useOrderTracking] Received location update for ${data.orderId}:`, data);
      if (data.orderId !== orderId) return;

      const newLocation: LatLng = {
        latitude: data.latitude,
        longitude: data.longitude,
      };

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
    },
    [orderId, destination]
  );

  useEffect(() => {
    if (!socket || !isConnected) return;

    if (subOrderId) {
      console.log(`[useOrderTracking] Joining room for sub-order: ${subOrderId}`);
      socket.emit("join_suborder_room", subOrderId);

      const handleSubOrderLocation = (data: any) => {
        console.log(`[useOrderTracking] Received sub-order location:`, data);
        if (data.subOrderId !== subOrderId) return;

        const newLocation: LatLng = {
          latitude: data.latitude,
          longitude: data.longitude,
        };

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
      };

      socket.on("delivery_location_updated", handleSubOrderLocation);

      return () => {
        console.log(`[useOrderTracking] Leaving sub-order room: ${subOrderId}`);
        socket.emit("leave_suborder_room", subOrderId);
        socket.off("delivery_location_updated", handleSubOrderLocation);
      };
    } else {
      console.log(`[useOrderTracking] Joining room for order: ${orderId}`);
      socket.emit(SocketEvents.JOIN_ORDER_ROOM, orderId);
      socket.on(SocketEvents.DELIVERY_LOCATION_UPDATED, handleLocationUpdate);

      return () => {
        console.log(`[useOrderTracking] Leaving room: ${orderId}`);
        socket.emit(SocketEvents.LEAVE_ORDER_ROOM, orderId);
        socket.off(SocketEvents.DELIVERY_LOCATION_UPDATED, handleLocationUpdate);
      };
    }
  }, [orderId, subOrderId, socket, isConnected, handleLocationUpdate, destination]);

  return {
    riderLocation,
    distance,
    eta,
    heading,
  };
};
