import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { LeafletMapComponent } from "@/src/features/Clothings/trackOrder/components/LeafletMapComponent";
import { DeliverySimulation } from "@/src/features/Clothings/trackOrder/components/DeliverySimulation";
import { TrackingInfoCard } from "@/src/features/Clothings/trackOrder/components/TrackingInfoCard";
import { getOrderByIdRequest, cancelSubOrderRequest } from "@/src/features/Clothings/order/api/order.api";
import { Ionicons } from "@expo/vector-icons";
import { useLocationTracking } from "@/src/features/Clothings/trackOrder/hooks/useLocationTracking";
import { useOrderTracking } from "@/src/features/Clothings/trackOrder/hooks/useOrderTracking";
import * as SecureStore from "expo-secure-store";
import { useSocketStore } from "@/src/store/useSocketStore";
import { SocketEvents } from "@/src/constants/socketEvents";

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams();
  const orderId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedSubOrder, setSelectedSubOrder] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

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
        const fetchedOrder = orderData?.data || orderData;
        setOrder(fetchedOrder);
        setUserRole(role);

        // Select initial sub-order
        if (fetchedOrder?.subOrders && fetchedOrder.subOrders.length > 0) {
          const firstActive = fetchedOrder.subOrders.find((s: any) => 
            !["DELIVERED", "CANCELLED", "COMPLETED"].includes(s.status)
          ) || fetchedOrder.subOrders[0];
          setSelectedSubOrder(firstActive);
        }
      } catch (error) {
        console.error("Error fetching order for tracking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  // Listen for real-time status updates to refresh order details
  useEffect(() => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      console.log("[TrackOrderScreen] Status update received:", data);
      getOrderByIdRequest(orderId)
        .then((orderData) => {
          const updated = orderData?.data || orderData;
          setOrder(updated);
          
          // Keep the currently selected sub-order in sync with the new data
          if (updated?.subOrders && selectedSubOrder) {
            const match = updated.subOrders.find((s: any) => s.subOrderId === selectedSubOrder.subOrderId);
            if (match) setSelectedSubOrder(match);
          } else if (updated?.subOrders && updated.subOrders.length > 0) {
            setSelectedSubOrder(updated.subOrders[0]);
          }
        })
        .catch((err) => console.error("Error updating order status in UI:", err));
    };

    socket.on(SocketEvents.ORDER_STATUS_UPDATE, handleStatusUpdate);
    socket.on(SocketEvents.FULFILLMENT_EVENT, handleStatusUpdate);

    return () => {
      socket.off(SocketEvents.ORDER_STATUS_UPDATE, handleStatusUpdate);
      socket.off(SocketEvents.FULFILLMENT_EVENT, handleStatusUpdate);
    };
  }, [orderId, selectedSubOrder]);

  // Destination coordinates from order address
  const destination = {
    latitude: order?.shippingAddress?.latitude || 25.5941,
    longitude: order?.shippingAddress?.longitude || 85.1376,
  };

  // Tracking hook (sockets, distance, ETA - no AnimatedRegion)
  const { riderLocation, distance, eta, heading } = useOrderTracking({
    orderId,
    subOrderId: selectedSubOrder?.subOrderId,
    destination,
    initialRiderLocation: selectedSubOrder?.delivery?.currentLocation || order?.deliveryPartnerLocation,
  });

  // Start background tracking IF user is delivery partner
  useLocationTracking({
    orderId,
    enabled: userRole === "DELIVERY",
  });

  const handleSubOrderCancel = (subOrderId: string) => {
    if (!subOrderId) return;
    
    Alert.alert(
      "Cancel Shipment",
      "Why do you want to cancel this package shipment?",
      [
        { text: "Change of Mind", onPress: () => submitCancellation(subOrderId, "Change of Mind") },
        { text: "Incorrect Shipping Address", onPress: () => submitCancellation(subOrderId, "Incorrect Shipping Address") },
        { text: "Delivery taking too long", onPress: () => submitCancellation(subOrderId, "Delivery taking too long") },
        { text: "Dismiss", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const submitCancellation = async (subOrderId: string, reason: string) => {
    try {
      setCancelLoading(true);
      const response = await cancelSubOrderRequest(subOrderId, reason);
      Alert.alert("Success", response.message || "Cancellation request sent.");
      
      const orderData = await getOrderByIdRequest(orderId);
      const updated = orderData?.data || orderData;
      setOrder(updated);
      
      if (updated?.subOrders) {
        const match = updated.subOrders.find((s: any) => s.subOrderId === subOrderId);
        if (match) setSelectedSubOrder(match);
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || "Failed to cancel shipment";
      Alert.alert("Cancellation Failed", errMsg);
    } finally {
      setCancelLoading(false);
    }
  };

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

        {/* Floating Shipment Selector at the top of the map */}
        {order?.subOrders && order.subOrders.length > 0 && (
          <View style={styles.shipmentSelector}>
            <Text style={styles.shipmentSelectorTitle}>Split Shipments</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shipmentScrollContent}
            >
              {order.subOrders.map((sub: any) => {
                const isSelected = selectedSubOrder?.subOrderId === sub.subOrderId;
                const storeName = sub.storeId?.name || `Package ${sub.subOrderId.split("-").pop()}`;
                
                return (
                  <TouchableOpacity
                    key={sub.subOrderId}
                    style={[
                      styles.shipmentTab,
                      isSelected && styles.shipmentTabActive,
                    ]}
                    onPress={() => setSelectedSubOrder(sub)}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={16}
                      color={isSelected ? "white" : "#666"}
                      style={{ marginRight: 5 }}
                    />
                    <View>
                      <Text
                        style={[
                          styles.shipmentTabLabel,
                          isSelected && styles.shipmentTabLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {storeName}
                      </Text>
                      <Text
                        style={[
                          styles.shipmentTabSubLabel,
                          isSelected && styles.shipmentTabSubLabelActive,
                        ]}
                      >
                        {sub.status.replace(/_/g, " ")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Info Card */}
      <SafeAreaView style={styles.infoSafeArea}>
        <TrackingInfoCard
          status={selectedSubOrder?.status || order?.status || "On the way"}
          eta={eta}
          distance={distance}
          riderName={selectedSubOrder?.delivery?.riderId?.fullName || order?.deliveryPartner?.fullName || ""}
          riderPhone={selectedSubOrder?.delivery?.riderId?.phone || order?.deliveryPartner?.phone || ""}
          deliveryOtp={selectedSubOrder?.delivery?.deliveryOtp}
          timeline={selectedSubOrder?.timeline}
          showCancelButton={
            selectedSubOrder 
              ? !["PICKED_UP", "IN_TRANSIT", "NEAR_CUSTOMER", "DELIVERED", "COMPLETED", "CANCELLED", "REJECTED"].includes(selectedSubOrder.status)
              : false
          }
          onCancelRequest={() => handleSubOrderCancel(selectedSubOrder?.subOrderId)}
          cancelButtonLoading={cancelLoading}
        />
      </SafeAreaView>

      {/* Simulation for testing */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <DeliverySimulation
            orderId={selectedSubOrder?.subOrderId || orderId}
            startLocation={{
              latitude: destination.latitude + 0.005,
              longitude: destination.longitude + 0.005,
            }}
            endLocation={destination}
          />
        </View>
      )}

      {/* Role Badge for Debug/Testing */}
      {userRole === "DELIVERY" && (
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
    top: 220,
    left: 0,
    right: 0,
  },
  shipmentSelector: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 90,
    left: 15,
    right: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  shipmentSelectorTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  shipmentScrollContent: {
    paddingRight: 10,
  },
  shipmentTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    minWidth: 140,
  },
  shipmentTabActive: {
    backgroundColor: "#FF6B00",
    borderColor: "#FF6B00",
  },
  shipmentTabLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  shipmentTabLabelActive: {
    color: "white",
  },
  shipmentTabSubLabel: {
    fontSize: 9,
    color: "#888",
    marginTop: 1,
    textTransform: "capitalize",
  },
  shipmentTabSubLabelActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },
});
