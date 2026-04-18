import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistance } from "../utils/geoUtils";

const { width } = Dimensions.get("window");

interface TrackingInfoCardProps {
  status: string;
  eta: number;
  distance: number;
  riderName: string;
  riderPhone: string;
}

export const TrackingInfoCard: React.FC<TrackingInfoCardProps> = ({
  status,
  eta,
  distance,
  riderName,
  riderPhone,
}) => {
  const handleCall = () => {
    Linking.openURL(`tel:${riderPhone}`);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Grabber for bottom sheet feel */}
      <View style={styles.grabber} />

      <View style={styles.header}>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>{status}</Text>
          <Text style={styles.etaLabel}>Arriving in {eta} mins</Text>
        </View>
        <View style={styles.distanceBox}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.riderRow}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        <View style={styles.riderInfo}>
          <Text style={styles.riderName}>{riderName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>4.8 | Professional</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="white" />
          <Text style={styles.callText}>Call</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={16} color="#00C853" />
        <Text style={styles.safetyText}>
          Your order is being delivered with contactless safety standards.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 10,
    width: width,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  statusBox: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: "#FF6B00",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  etaLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  distanceBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 15,
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  riderInfo: {
    flex: 1,
    marginLeft: 15,
  },
  riderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
  callButton: {
    backgroundColor: "#00C853",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  callText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    padding: 10,
    borderRadius: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: 10,
    color: "#00C853",
    marginLeft: 8,
  },
});
