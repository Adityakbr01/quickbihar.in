import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { LeafletMapComponent } from "@/src/features/Clothings/trackOrder/components/LeafletMapComponent";
import { DeliverySimulation } from "@/src/features/Clothings/trackOrder/components/DeliverySimulation";
import { TrackingInfoCard } from "@/src/features/Clothings/trackOrder/components/TrackingInfoCard";
import { getOrderByIdRequest } from "@/src/features/Clothings/order/api/order.api";
import { Ionicons } from "@expo/vector-icons";
import { useLocationTracking } from "@/src/features/Clothings/trackOrder/hooks/useLocationTracking";
import { useOrderTracking } from "@/src/features/Clothings/trackOrder/hooks/useOrderTracking";
import * as SecureStore from "expo-secure-store";
import { useSocketStore } from "@/src/store/useSocketStore";

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams();
  const orderId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch order details and user role
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderData, role] = await Promise.all([
          getOrderByIdRequest(orderId),
          SecureStore.getItemAsync("userRole"),
          useSocketStore.getState().connect(),
        ]);
        setOrder(orderData?.data || orderData);
        setUserRole(role);
      } catch (error) {
        console.error("Error fetching order for tracking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  // Destination coordinates from order address
  const destination = {
    latitude: order?.shippingAddress?.latitude || 25.5941,
    longitude: order?.shippingAddress?.longitude || 85.1376,
  };

  // Tracking hook (sockets, distance, ETA - no AnimatedRegion)
  const { riderLocation, distance, eta, heading } = useOrderTracking({
    orderId,
    destination,
    initialRiderLocation: order?.deliveryPartnerLocation,
  });

  // Start background tracking IF user is delivery partner
  useLocationTracking({
    orderId,
    enabled: userRole === "delivery_partner",
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Connecting to Live Tracking...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#999" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconButton}
            >
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* 100% Free Leaflet/OSM Map */}
      <View style={styles.mapContainer}>
        <LeafletMapComponent
          riderLocation={riderLocation}
          destination={destination}
          heading={heading}
        />
      </View>

      {/* Info Card */}
      <SafeAreaView style={styles.infoSafeArea}>
        <TrackingInfoCard
          status={order?.status || "On the way"}
          eta={eta}
          distance={distance}
          riderName={order?.deliveryPartner?.fullName || "Karan Kumar"}
          riderPhone={order?.deliveryPartner?.phone || "9999999999"}
        />
      </SafeAreaView>

      {/* Simulation for testing */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <DeliverySimulation
            orderId={orderId}
            startLocation={{
              latitude: destination.latitude + 0.005,
              longitude: destination.longitude + 0.005,
            }}
            endLocation={destination}
          />
        </View>
      )}

      {/* Role Badge for Debug/Testing */}
      {userRole === "delivery_partner" && (
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Transmitting Live Location</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  mapContainer: {
    flex: 1,
  },
  infoSafeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  infoCard: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: "#EEE",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusBadge: {
    backgroundColor: "#FFF0E6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#FF6B00",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  etaText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  deliveryAgentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },
  agentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  agentSub: {
    fontSize: 12,
    color: "#999",
  },
  callButton: {
    backgroundColor: "#00C853",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  addressText: {
    flex: 1,
    marginLeft: 10,
    color: "#666",
    fontSize: 13,
    lineHeight: 18,
  },
  iconButton: {
    backgroundColor: "white",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 15,
    marginTop: Platform.OS === "ios" ? 0 : 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    color: "#666",
    fontSize: 14,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FF6B00",
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  roleBadge: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 200, 83, 0.9)",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  roleBadgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  debugContainer: {
    position: "absolute",
    top: 150,
    left: 0,
    right: 0,
  },
});
