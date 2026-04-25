import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useSocketStore } from "@/src/store/useSocketStore";
import { getOrderByIdRequest } from "@/src/features/Clothings/order/api/order.api";
import { useOrderTracking } from "@/src/features/Clothings/trackOrder/hooks/useOrderTracking";
import { LeafletMapComponent } from "@/src/features/Clothings/trackOrder/components/LeafletMapComponent";
import { TrackingInfoCard } from "@/src/features/Clothings/trackOrder/components/TrackingInfoCard";

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams();
  const orderId = Array.isArray(id) ? id[0] : id || "";
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [orderData] = await Promise.all([
          getOrderByIdRequest(orderId),
          useSocketStore.getState().connect(),
        ]);
        setOrder(orderData?.data || orderData);
      } catch (err) {
        console.error("Account Tracking Init Error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [orderId]);

  const destination = {
    latitude: order?.shippingAddress?.latitude || 25.5941,
    longitude: order?.shippingAddress?.longitude || 85.1376,
  };

  const { riderLocation, distance, eta, heading } = useOrderTracking({
    orderId,
    destination,
    initialRiderLocation: order?.deliveryPartnerLocation,
  });

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
      </View>

      <SafeAreaView style={styles.infoWrapper}>
        <TrackingInfoCard
          status={order?.status || "Processing"}
          eta={eta}
          distance={distance}
          riderName={order?.deliveryPartner?.fullName || "Delivery Partner"}
          riderPhone={order?.deliveryPartner?.phone || ""}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingTop: 50,
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
});
