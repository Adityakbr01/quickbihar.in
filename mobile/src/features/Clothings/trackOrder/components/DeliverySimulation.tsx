import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSocketStore } from "@/src/store/useSocketStore";
import { SocketEvents } from "@/src/constants/socketEvents";
import { Ionicons } from "@expo/vector-icons";

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
        alert("Socket not connected! Please check your internet.");
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
    <View style={styles.container}>
      <Text style={styles.title}>Live Delivery Simulation</Text>
      <TouchableOpacity
        style={[styles.button, isSimulating ? styles.stopButton : styles.startButton]}
        onPress={isSimulating ? stopSimulation : startSimulation}
      >
        <Ionicons name={isSimulating ? "square" : "play"} size={18} color="white" />
        <Text style={styles.buttonText}>
          {isSimulating ? "Stop Simulation" : "Simulate Rider Movement"}
        </Text>
      </TouchableOpacity>
      {isSimulating && (
        <Text style={styles.hint}>Emitting mock route coordinates to Server...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 15,
    margin: 15,
    borderWidth: 1,
    borderColor: "#FF6B00",
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 10,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  startButton: {
    backgroundColor: "#FF6B00",
  },
  stopButton: {
    backgroundColor: "#E74C3C",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  hint: {
    marginTop: 8,
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});
