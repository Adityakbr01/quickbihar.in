import React, { useState, useRef } from "react";
import { useSocketStore } from "@/src/store/useSocketStore";
import { SocketEvents } from "@/src/constants/socketEvents";
import { Play, Square } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface DeliverySimulationProps {
  orderId: string;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
}

export const DeliverySimulation: React.FC<DeliverySimulationProps> = ({
  orderId,
  startLocation,
  endLocation,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const { socket, isConnected } = useSocketStore();
  const intervalRef = useRef<any>(null);

  const startSimulation = async () => {
    if (!isConnected || !socket) {
      await useSocketStore.getState().connect();
      const currentState = useSocketStore.getState();
      if (!currentState.isConnected || !currentState.socket) {
        window.alert("Socket not connected! Please check your internet.");
        return;
      }
    }

    setIsSimulating(true);
    let step = 0;
    const totalSteps = 50; // Fewer steps for more visible movement

    // Generate mock route waypoints (Simplified curve to mimic streets)
    const waypoints: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= totalSteps; i++) {
        const t = i / totalSteps;
        // Linear interpolation with a curve offset
        const midLat = startLocation.latitude + (endLocation.latitude - startLocation.latitude) * t;
        const midLng = startLocation.longitude + (endLocation.longitude - startLocation.longitude) * t;

        // Add a "street-like" curve offset (S-Curve)
        const offset = 0.0005 * Math.sin(t * Math.PI * 2);
        waypoints.push({
            lat: midLat + offset,
            lng: midLng + (i % 2 === 0 ? offset : -offset)
        });
    }

    intervalRef.current = setInterval(() => {
      if (step >= totalSteps) {
        stopSimulation();
        return;
      }

      const currentPos = waypoints[step];
      const nextPos = waypoints[step + 1] || currentPos;

      // Calculate Heading based on next point
      const heading = (Math.atan2(nextPos.lng - currentPos.lng, nextPos.lat - currentPos.lat) * 180) / Math.PI;

      socket?.emit(SocketEvents.UPDATE_DELIVERY_LOCATION, {
        orderId,
        latitude: currentPos.lat,
        longitude: currentPos.lng,
        heading: heading,
      });

      console.log(`[Simulation] Relaying: ${currentPos.lat}, ${currentPos.lng} | Heading: ${heading}`);
      step++;
    }, 1500); // 1.5 seconds per step
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
  };

  return (
    <div className="m-[15px] rounded-[15px] border border-dashed border-[#FF6B00] bg-white/90 p-[15px] shadow">
      <p className="mb-2.5 text-center text-xs font-bold tracking-widest text-[#FF6B00] uppercase">
        Live Delivery Simulation
      </p>
      <button
        type="button"
        onClick={isSimulating ? stopSimulation : startSimulation}
        className={cn(
          "flex w-full flex-row items-center justify-center rounded-[10px] py-3",
          isSimulating ? "bg-[#E74C3C]" : "bg-[#FF6B00]",
        )}
      >
        {isSimulating ? (
        <Square size={18} color="white" fill="white" />
      ) : (
        <Play size={18} color="white" fill="white" />
      )}
        <span className="ml-2 font-bold text-white">
          {isSimulating ? "Stop Simulation" : "Simulate Rider Movement"}
        </span>
      </button>
      {isSimulating && (
        <p className="mt-2 text-center text-[11px] text-[#666] italic">
          Emitting mock route coordinates to Server...
        </p>
      )}
    </div>
  );
};
