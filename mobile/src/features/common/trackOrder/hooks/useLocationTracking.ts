import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { useSocketStore } from "@/src/store/useSocketStore";
import { SocketEvents } from "@/src/constants/socketEvents";

interface LocationTrackingOptions {
  orderId: string;
  enabled: boolean;
  onLocationUpdate?: (location: Location.LocationObject) => void;
}

export const useLocationTracking = ({
  orderId,
  enabled,
  onLocationUpdate,
}: LocationTrackingOptions) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { socket, isConnected } = useSocketStore();

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or every 10 meters
          },
          (location) => {
            if (onLocationUpdate) {
              onLocationUpdate(location);
            }

            // If socket is connected, emit the update
            if (isConnected && socket && orderId) {
              socket.emit(SocketEvents.UPDATE_DELIVERY_LOCATION, {
                orderId,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                heading: location.coords.heading || 0,
              });
              console.log("[useLocationTracking] Emitted location update", {
                orderId,
                lat: location.coords.latitude,
                lng: location.coords.longitude,
              });
            }
          }
        );
      } catch (error) {
        console.error("[useLocationTracking] Error starting tracking:", error);
        setErrorMsg("Failed to start location tracking");
      }
    };

    if (enabled && orderId) {
      startTracking();
    }

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, [enabled, orderId, socket, isConnected, onLocationUpdate]);

  return { errorMsg };
};
