import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useSocketStore } from "@/src/store/useSocketStore";
import {
  getOrderByIdRequest,
  cancelSubOrderRequest,
} from "@/src/features/Clothings/order/api/order.api";
import { useOrderTracking } from "@/src/features/Clothings/trackOrder/hooks/useOrderTracking";
import { LeafletMapComponent } from "@/src/features/Clothings/trackOrder/components/LeafletMapComponent";
import { TrackingInfoCard } from "@/src/features/Clothings/trackOrder/components/TrackingInfoCard";

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams();
  const orderId = Array.isArray(id) ? id[0] : id || "";
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubOrder, setSelectedSubOrder] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [orderData] = await Promise.all([
          getOrderByIdRequest(orderId),
          useSocketStore.getState().connect(),
        ]);
        const fetchedOrder = orderData?.data || orderData;
        setOrder(fetchedOrder);

        if (fetchedOrder?.subOrders && fetchedOrder.subOrders.length > 0) {
          const firstActive =
            fetchedOrder.subOrders.find(
              (s: any) =>
                !["DELIVERED", "CANCELLED", "COMPLETED"].includes(s.status),
            ) || fetchedOrder.subOrders[0];
          setSelectedSubOrder(firstActive);
        }
      } catch (err) {
        console.error("Account Tracking Init Error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [orderId]);

  // Listen for real-time status updates
  useEffect(() => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      console.log("[AccountTrackOrderScreen] Status update received:", data);
      getOrderByIdRequest(orderId)
        .then((orderData) => {
          const updated = orderData?.data || orderData;
          setOrder(updated);

          if (updated?.subOrders && selectedSubOrder) {
            const match = updated.subOrders.find(
              (s: any) => s.subOrderId === selectedSubOrder.subOrderId,
            );
            if (match) setSelectedSubOrder(match);
          } else if (updated?.subOrders && updated.subOrders.length > 0) {
            setSelectedSubOrder(updated.subOrders[0]);
          }
        })
        .catch((err) =>
          console.error(
            "Error updating order status in account tracking:",
            err,
          ),
        );
    };

    socket.on("ORDER_STATUS_UPDATE", handleStatusUpdate);

    return () => {
      socket.off("ORDER_STATUS_UPDATE", handleStatusUpdate);
    };
  }, [orderId, selectedSubOrder]);

  const destination = {
    latitude: order?.shippingAddress?.latitude || 25.5941,
    longitude: order?.shippingAddress?.longitude || 85.1376,
  };

  const { riderLocation, distance, eta, heading } = useOrderTracking({
    orderId,
    subOrderId: selectedSubOrder?.subOrderId,
    destination,
    initialRiderLocation:
      selectedSubOrder?.delivery?.currentLocation ||
      order?.deliveryPartnerLocation,
  });

  const handleSubOrderCancel = (subOrderId: string) => {
    if (!subOrderId) return;

    Alert.alert(
      "Cancel Shipment",
      "Why do you want to cancel this package shipment?",
      [
        {
          text: "Change of Mind",
          onPress: () => submitCancellation(subOrderId, "Change of Mind"),
        },
        {
          text: "Incorrect Shipping Address",
          onPress: () =>
            submitCancellation(subOrderId, "Incorrect Shipping Address"),
        },
        {
          text: "Delivery taking too long",
          onPress: () =>
            submitCancellation(subOrderId, "Delivery taking too long"),
        },
        { text: "Dismiss", style: "cancel" },
      ],
      { cancelable: true },
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
        const match = updated.subOrders.find(
          (s: any) => s.subOrderId === subOrderId,
        );
        if (match) setSelectedSubOrder(match);
      }
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to cancel shipment";
      Alert.alert("Cancellation Failed", errMsg);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Track Order</Text>
      </View>

      <View style={styles.mapContainer}>
        <LeafletMapComponent
          riderLocation={riderLocation}
          destination={destination}
          heading={heading}
        />

        {/* Floating Shipment Selector */}
        {order?.subOrders && order.subOrders.length > 0 && (
          <View style={styles.shipmentSelector}>
            <Text style={styles.shipmentSelectorTitle}>Split Shipments</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shipmentScrollContent}
            >
              {order.subOrders.map((sub: any) => {
                const isSelected =
                  selectedSubOrder?.subOrderId === sub.subOrderId;
                const storeName =
                  sub.storeId?.name ||
                  `Package ${sub.subOrderId.split("-").pop()}`;

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
                      size={14}
                      color={isSelected ? "white" : "#666"}
                      style={{ marginRight: 4 }}
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

      <SafeAreaView style={styles.infoWrapper}>
        <TrackingInfoCard
          status={selectedSubOrder?.status || order?.status || "Processing"}
          eta={eta}
          distance={distance}
          riderName={
            selectedSubOrder?.delivery?.riderId?.fullName ||
            order?.deliveryPartner?.fullName ||
            ""
          }
          riderPhone={
            selectedSubOrder?.delivery?.riderId?.phone ||
            order?.deliveryPartner?.phone ||
            ""
          }
          deliveryOtp={selectedSubOrder?.delivery?.deliveryOtp}
          timeline={selectedSubOrder?.timeline}
          showCancelButton={
            selectedSubOrder
              ? ![
                  "PICKED_UP",
                  "IN_TRANSIT",
                  "NEAR_CUSTOMER",
                  "DELIVERED",
                  "COMPLETED",
                  "CANCELLED",
                  "REJECTED",
                ].includes(selectedSubOrder.status)
              : false
          }
          onCancelRequest={() =>
            handleSubOrderCancel(selectedSubOrder?.subOrderId)
          }
          cancelButtonLoading={cancelLoading}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingHorizontal: 16,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", marginLeft: 10 },
  mapContainer: { flex: 1 },
  infoWrapper: { position: "absolute", bottom: 0, left: 0, right: 0 },
  shipmentSelector: {
    position: "absolute",
    top: 15,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    minWidth: 130,
  },
  shipmentTabActive: {
    backgroundColor: "#FF6B00",
    borderColor: "#FF6B00",
  },
  shipmentTabLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333",
  },
  shipmentTabLabelActive: {
    color: "white",
  },
  shipmentTabSubLabel: {
    fontSize: 8,
    color: "#888",
    marginTop: 1,
    textTransform: "capitalize",
  },
  shipmentTabSubLabelActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },
});
