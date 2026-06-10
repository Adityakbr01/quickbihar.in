import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
  ScrollView,
  ActivityIndicator,
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
  deliveryOtp?: string;
  timeline?: any[];
  onCancelRequest?: () => void;
  showCancelButton?: boolean;
  cancelButtonLoading?: boolean;
}

export const TrackingInfoCard: React.FC<TrackingInfoCardProps> = ({
  status,
  eta,
  distance,
  riderName,
  riderPhone,
  deliveryOtp,
  timeline,
  onCancelRequest,
  showCancelButton,
  cancelButtonLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCall = () => {
    if (riderPhone) {
      Linking.openURL(`tel:${riderPhone}`);
    }
  };

  const isCancellationRequested = timeline && timeline.length > 0 &&
    (timeline[timeline.length - 1]?.metadata?.message?.includes("requested cancellation") || 
     timeline[timeline.length - 1]?.metadata?.message?.includes("Requested cancellation") || false);

  const formattedStatus = status.replace(/_/g, " ");

  return (
    <View style={styles.cardContainer}>
      {/* Grabber for bottom sheet feel */}
      <View style={styles.grabber} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>{formattedStatus}</Text>
            <Text style={styles.etaLabel}>
              {["DELIVERED", "CANCELLED", "COMPLETED"].includes(status) 
                ? "Completed" 
                : eta > 0 
                  ? `Arriving in ${eta} mins` 
                  : "Arriving soon"}
            </Text>
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
            <Text style={styles.riderName}>{riderName || "Assigning Rider..."}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>
                {riderName ? "4.8 | Professional" : "Securing partner"}
              </Text>
            </View>
          </View>
          {riderPhone ? (
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color="white" />
              <Text style={styles.callText}>Call</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Toggle details button */}
        <TouchableOpacity
          style={styles.toggleDetailsButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.toggleDetailsText}>
            {isExpanded ? "Hide Details" : "View Timeline & OTP"}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#FF6B00"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* OTP Section */}
            {deliveryOtp && !["DELIVERED", "CANCELLED", "COMPLETED"].includes(status) && (
              <View style={styles.otpSection}>
                <Text style={styles.otpTitle}>Delivery OTP</Text>
                <View style={styles.otpContainer}>
                  {deliveryOtp.split("").map((digit, index) => (
                    <View key={index} style={styles.otpDigitBox}>
                      <Text style={styles.otpDigitText}>{digit}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.otpSubtext}>
                  Share this OTP with the delivery rider to verify and confirm your delivery.
                </Text>
              </View>
            )}

            {/* Timeline Section */}
            {timeline && timeline.length > 0 && (
              <View style={styles.timelineSection}>
                <Text style={styles.sectionTitle}>Delivery Timeline</Text>
                {timeline.map((event, index) => {
                  const isLast = index === timeline.length - 1;
                  const dateStr = event.timestamp
                    ? new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";
                  const dateDay = event.timestamp
                    ? new Date(event.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })
                    : "";
                  
                  return (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineLineContainer}>
                        <View style={[styles.timelineNode, isLast && styles.timelineNodeActive]} />
                        {!isLast && <View style={styles.timelineVerticalLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeaderRow}>
                          <Text style={[styles.timelineStatus, isLast && styles.timelineStatusActive]}>
                            {event.status.replace(/_/g, " ")}
                          </Text>
                          <Text style={styles.timelineTime}>
                            {dateDay}, {dateStr}
                          </Text>
                        </View>
                        <Text style={styles.timelineDesc}>
                          {event.metadata?.message || `Order status updated to ${event.status.replace(/_/g, " ")}`}
                        </Text>
                        {event.metadata?.reason && (
                          <Text style={styles.timelineReason}>
                            Reason: {event.metadata.reason}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Cancellation Requested Badge */}
            {isCancellationRequested && (
              <View style={styles.cancellationRequestedBadge}>
                <Ionicons name="time" size={16} color="#FF9F00" />
                <Text style={styles.cancellationRequestedText}>
                  Cancellation requested. Pending store approval.
                </Text>
              </View>
            )}

            {/* Cancel Button */}
            {showCancelButton && !isCancellationRequested && (
              <TouchableOpacity
                style={styles.cancelOrderButton}
                onPress={onCancelRequest}
                disabled={cancelButtonLoading}
              >
                {cancelButtonLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.cancelOrderText}>Request Cancel Shipment</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={16} color="#00C853" />
          <Text style={styles.safetyText}>
            Your order is being delivered with contactless safety standards.
          </Text>
        </View>
      </ScrollView>
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
  scrollContainer: {
    maxHeight: 450,
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
    marginTop: 5,
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
  toggleDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#FFF0E6",
    borderRadius: 12,
    marginBottom: 15,
  },
  toggleDetailsText: {
    color: "#FF6B00",
    fontWeight: "bold",
    marginRight: 6,
    fontSize: 13,
  },
  expandedContent: {
    paddingVertical: 5,
  },
  otpSection: {
    alignItems: "center",
    backgroundColor: "#FDF9F4",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFEEDD",
    marginBottom: 15,
  },
  otpTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#996633",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  otpDigitBox: {
    width: 38,
    height: 44,
    borderWidth: 1.5,
    borderColor: "#FF6B00",
    borderRadius: 8,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  otpDigitText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  otpSubtext: {
    fontSize: 11,
    color: "#996633",
    textAlign: "center",
    lineHeight: 15,
  },
  timelineSection: {
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 50,
  },
  timelineLineContainer: {
    width: 20,
    alignItems: "center",
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#CCC",
    marginTop: 4,
  },
  timelineNodeActive: {
    backgroundColor: "#FF6B00",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFE0CC",
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 15,
  },
  timelineHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  timelineStatus: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    textTransform: "capitalize",
  },
  timelineStatusActive: {
    color: "#FF6B00",
  },
  timelineTime: {
    fontSize: 10,
    color: "#999",
  },
  timelineDesc: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  timelineReason: {
    fontSize: 11,
    color: "#DD3333",
    fontStyle: "italic",
    marginTop: 2,
  },
  cancellationRequestedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFEBAA",
    marginBottom: 15,
  },
  cancellationRequestedText: {
    fontSize: 12,
    color: "#B27D00",
    marginLeft: 8,
    fontWeight: "600",
  },
  cancelOrderButton: {
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cancelOrderText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
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
