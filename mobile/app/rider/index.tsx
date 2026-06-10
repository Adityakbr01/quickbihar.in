import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { SocketEvents } from "@/src/constants/socketEvents";
import { useSocketStore } from "@/src/store/useSocketStore";
import { deliveryApi, type DeliveryLocationPayload, type RiderOffer } from "@/src/features/Delivery/api/delivery.api";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { type Theme, useTheme } from "@/src/theme/Provider/ThemeProvider";
import IOSAlertDialog, { type AlertButton } from "@/src/components/ui/IOSAlertDialog";

const activeStatuses = ["RIDER_ASSIGNED", "RIDER_ARRIVING", "RIDER_REACHED_STORE", "PICKED_UP", "IN_TRANSIT", "NEAR_CUSTOMER"];

const money = (amount?: number) => `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount || 0)}`;
const label = (value?: string) => (value || "-").replace(/_/g, " ");
const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
const storeNameOf = (offer: any) =>
  offer?.metadata?.storeName || offer?.storeName || offer?.subOrder?.storeId?.name || "Pickup store";
const normalizedOffer = (offer: any): RiderOffer => ({
  ...offer,
  _id: offer?._id || offer?.offerId,
  offerId: offer?.offerId,
  subOrderId: offer?.subOrderId,
  status: offer?.status || "OPEN",
  stage: Number(offer?.stage || 1),
  radiusKm: Number(offer?.radiusKm || 0),
  payoutAmount: Number(offer?.payoutAmount || 0),
  distanceKm: offer?.distanceKm,
  riderDistanceToStoreKm: offer?.riderDistanceToStoreKm,
  expiresAt: offer?.expiresAt || new Date().toISOString(),
  metadata: {
    ...(offer?.metadata || {}),
    storeName: storeNameOf(offer),
    storeAddress: offer?.metadata?.storeAddress || offer?.storeAddress,
  },
});

type RiderDialog = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

type ShowDialog = (title: string, message?: string, buttons?: AlertButton[]) => void;
type ProofState = {
  pickupOtp: string;
  pickupPhoto: string;
  deliveryOtp: string;
  deliveryPhoto: string;
};

const emptyProof: ProofState = {
  pickupOtp: "",
  pickupPhoto: "",
  deliveryOtp: "",
  deliveryPhoto: "",
};

async function currentLocation(): Promise<DeliveryLocationPayload | undefined> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return undefined;
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    heading: position.coords.heading || 0,
  };
}

async function pickProofPhoto(showDialog: ShowDialog) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    showDialog("Camera Permission Required", "Photo proof is required for pickup and delivery.");
    return "";
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.55,
    allowsEditing: false,
  });
  if (result.canceled) return "";
  return result.assets[0]?.uri || "";
}

async function notifyLocalOffer(offer: RiderOffer) {
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "New Delivery Offer",
        body: `${storeNameOf(offer)} - ${money(offer.payoutAmount)}`,
        sound: true,
      },
      trigger: null,
    });
  } catch {
    // In-app dialog is the primary path; local notification support varies by runtime.
  }
}

export default function RiderWorkflowScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { socket, connect } = useSocketStore();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<RiderOffer[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [proofByOrder, setProofByOrder] = useState<Record<string, ProofState>>({});
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<RiderDialog | null>(null);
  const notifiedOfferIds = useRef<Set<string>>(new Set());

  const isOnline = Boolean(profile?.isOnline);
  const codLiability = Number(profile?.wallet?.collectedCodLiability || 0);
  const activeOrder = useMemo(
    () => activeOrders.find((order) => order.subOrderId === selectedJobId) || activeOrders[0] || null,
    [activeOrders, selectedJobId],
  );
  const currentCapacity = (offers.find((offer: any) => offer?.riderCapacity) as any)?.riderCapacity;
  const totalOpenValue = offers.reduce((sum, offer) => sum + Number(offer.payoutAmount || 0), 0);
  const showDialog: ShowDialog = (title, message, buttons = [{ text: "OK", style: "cancel" }]) => {
    setDialog({ title, message, buttons });
  };
  const dialogView = (
    <IOSAlertDialog
      visible={!!dialog}
      onClose={() => setDialog(null)}
      title={dialog?.title || ""}
      message={dialog?.message}
      buttons={dialog?.buttons || [{ text: "OK", style: "cancel" }]}
    />
  );

  const refresh = async () => {
    const [sync, openOffers] = await Promise.all([deliveryApi.sync(), deliveryApi.getOffers()]);
    const nextActiveOrders = sync?.activeOrders || (sync?.activeOrder ? [sync.activeOrder] : []);
    setActiveOrders(nextActiveOrders);
    setSelectedJobId((current) =>
      current && nextActiveOrders.some((order: any) => order.subOrderId === current)
        ? current
        : nextActiveOrders[0]?.subOrderId || null,
    );
    setProfile(sync?.profile || null);
    setOffers(openOffers || []);
    if (openOffers?.length) {
      promptOffer(openOffers[0]);
    }
  };

  useEffect(() => {
    const boot = async () => {
      try {
        await connect();
        await refresh();
      } catch (error: any) {
        showDialog("Rider Sync Failed", errorMessage(error, "Could not load rider dashboard."));
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onOffer = (offer: RiderOffer) => {
      const nextOffer = normalizedOffer(offer);
      setOffers((current) => [nextOffer, ...current.filter((item) => item.offerId !== nextOffer.offerId)]);
      promptOffer(nextOffer);
    };
    const onRefresh = () => refresh().catch(() => undefined);
    socket.on(SocketEvents.RIDER_JOB_OFFER, onOffer);
    socket.on(SocketEvents.FULFILLMENT_EVENT, onRefresh);
    socket.on(SocketEvents.ORDER_STATUS_UPDATE, onRefresh);
    return () => {
      socket.off(SocketEvents.RIDER_JOB_OFFER, onOffer);
      socket.off(SocketEvents.FULFILLMENT_EVENT, onRefresh);
      socket.off(SocketEvents.ORDER_STATUS_UPDATE, onRefresh);
    };
  }, [socket]);

  const updateProof = (subOrderId: string, patch: Partial<ProofState>) => {
    setProofByOrder((current) => ({
      ...current,
      [subOrderId]: {
        ...emptyProof,
        ...(current[subOrderId] || {}),
        ...patch,
      },
    }));
  };

  const proofFor = (subOrderId: string): ProofState => ({
    ...emptyProof,
    ...(proofByOrder[subOrderId] || {}),
  });

  const actionFor = (order: any) => {
    if (!order) return null;
    const requireLocation = async () => {
      const location = await currentLocation();
      if (!location) {
        throw new Error("Location permission is required for this rider checkpoint.");
      }
      return location;
    };
    const status = order.status;
    const proof = proofFor(order.subOrderId);
    if (status === "RIDER_ASSIGNED") return { label: "Start To Store", run: () => deliveryApi.arriving(order.subOrderId) };
    if (status === "RIDER_ARRIVING") return { label: "Reached Store", run: async () => deliveryApi.reachedStore(order.subOrderId, await requireLocation()) };
    if (status === "RIDER_REACHED_STORE") return { label: "Verify Pickup", run: () => deliveryApi.pickup(order.subOrderId, { pickupOtp: proof.pickupOtp, pickupPhoto: proof.pickupPhoto }) };
    if (status === "PICKED_UP") return { label: "Start Transit", run: () => deliveryApi.transit(order.subOrderId) };
    if (status === "IN_TRANSIT") return { label: "Near Customer", run: async () => deliveryApi.nearCustomer(order.subOrderId, await requireLocation()) };
    if (status === "NEAR_CUSTOMER") return { label: "Complete Delivery", run: () => deliveryApi.deliver(order.subOrderId, { deliveryOtp: proof.deliveryOtp, deliveryPhoto: proof.deliveryPhoto }) };
    return null;
  };

  const nextAction = actionFor(activeOrder);

  function promptOffer(offer: RiderOffer) {
    if (!offer?.offerId || notifiedOfferIds.current.has(offer.offerId)) return;

    notifiedOfferIds.current.add(offer.offerId);
    notifyLocalOffer(offer);
    showDialog(
      "New Delivery Offer",
      `${storeNameOf(offer)}\n${money(offer.payoutAmount)} payout\n${offer.riderDistanceToStoreKm ?? "-"} km to store, ${offer.distanceKm ?? "-"} km delivery`,
      [
        {
          text: "Reject",
          style: "destructive",
          onPress: () => handleOfferResponse(offer, false),
        },
        {
          text: "Accept",
          onPress: () => handleOfferResponse(offer, true),
        },
      ],
    );
  }

  function handleOfferResponse(offer: RiderOffer, shouldAccept: boolean) {
    return runAction(async () => {
      if (shouldAccept) {
        await deliveryApi.acceptOffer(offer.offerId);
      } else {
        await deliveryApi.rejectOffer(offer.offerId);
      }
    });
  }

  const runAction = async (action: () => Promise<any>) => {
    try {
      setBusy(true);
      await action();
      await refresh();
    } catch (error: any) {
      showDialog("Action Failed", errorMessage(error, "Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const toggleOnline = async () => {
    try {
      setBusy(true);
      const nextOnline = !isOnline;
      const location = await currentLocation();
      if (nextOnline && !location) {
        throw new Error("Location permission is required before you can receive delivery offers.");
      }
      await deliveryApi.updateAvailability({ isOnline: nextOnline, location });
      await refresh();
      if (nextOnline) {
        setTimeout(() => refresh().catch(() => undefined), 1500);
      }
    } catch (error: any) {
      showDialog("Availability Failed", errorMessage(error, "Could not update duty status."));
    } finally {
      setBusy(false);
    }
  };

  const acceptOffer = async (offer: RiderOffer) => {
    await runAction(async () => deliveryApi.acceptOffer(offer.offerId));
  };

  const rejectOffer = async (offer: RiderOffer) => {
    await runAction(async () => deliveryApi.rejectOffer(offer.offerId));
  };

  if (loading) {
    return (
      <SafeViewWrapper>
        <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.muted}>Loading rider workspace...</Text>
        </View>
        {dialogView}
      </SafeViewWrapper>
    );
  }

  return (
    <SafeViewWrapper>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>QuickBihar Rider</Text>
            <Text style={styles.title}>Delivery Workspace</Text>
          </View>
          <TouchableOpacity style={[styles.statusButton, isOnline && styles.statusOnline]} onPress={toggleOnline} disabled={busy}>
            <Ionicons name={isOnline ? "radio" : "power"} size={17} color={isOnline ? "#fff" : theme.background} />
            <Text style={[styles.statusButtonText, isOnline && styles.statusOnlineText]}>{isOnline ? "Online" : "Go Online"}</Text>
          </TouchableOpacity>
        </View>

        {codLiability > 0 && (
          <View style={styles.codCard}>
            <Text style={styles.codLabel}>Pending COD Liability</Text>
            <Text style={styles.codAmount}>{money(codLiability)}</Text>
            <Text style={styles.codCopy}>Deposit collected cash with admin to clear this balance.</Text>
          </View>
        )}

        <View style={styles.summaryGrid}>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{activeOrders.length}</Text>
            <Text style={styles.summaryLabel}>Active Jobs</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{offers.length}</Text>
            <Text style={styles.summaryLabel}>Open Offers</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{money(totalOpenValue)}</Text>
            <Text style={styles.summaryLabel}>Offer Value</Text>
          </View>
        </View>

        {currentCapacity && (
          <View style={styles.capacityBar}>
            <View>
              <Text style={styles.capacityTitle}>Acceptance Capacity</Text>
              <Text style={styles.muted}>
                {currentCapacity.acceptedCountInWindow || 0}/{currentCapacity.maxAcceptedOrders || 15} accepted in {currentCapacity.acceptanceWindowHours || 12}h
              </Text>
            </View>
            <Text style={styles.capacityPill}>{currentCapacity.remainingAfterAccept ?? "-"} left</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Queue</Text>
            <Text style={styles.sectionMeta}>{activeOrders.length} jobs</Text>
          </View>
          {activeOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={24} color={theme.tertiaryText} />
              <Text style={styles.muted}>No active delivery assigned.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobTabs}>
              {activeOrders.map((order) => {
                const selected = activeOrder?.subOrderId === order.subOrderId;
                return (
                  <TouchableOpacity
                    key={order.subOrderId}
                    style={[styles.jobTab, selected && styles.jobTabSelected]}
                    onPress={() => setSelectedJobId(order.subOrderId)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.jobTabId, selected && styles.jobTabIdSelected]} numberOfLines={1}>
                      {order.subOrderId}
                    </Text>
                    <Text style={[styles.jobTabStatus, selected && styles.jobTabStatusSelected]} numberOfLines={1}>
                      {label(order.status)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Offer Queue</Text>
            <Text style={styles.sectionMeta}>{offers.length} waiting</Text>
          </View>
          {offers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="notifications-off-outline" size={24} color={theme.tertiaryText} />
              <Text style={styles.muted}>No active rider offers right now.</Text>
            </View>
          ) : (
            <FlatList
              data={offers}
              keyExtractor={(item) => item.offerId}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.offerCard}>
                  <View style={styles.offerTop}>
                    <View>
                      <Text style={styles.offerId}>{item.subOrderId}</Text>
                      <Text style={styles.muted}>{item.metadata?.storeName || item.subOrder?.storeId?.name || "Pickup store"}</Text>
                    </View>
                    <Text style={styles.payout}>{money(item.payoutAmount)}</Text>
                  </View>
                  <View style={styles.metricsRow}>
                    <Text style={styles.metric}>{item.riderDistanceToStoreKm ?? "-"} km to store</Text>
                    <Text style={styles.metric}>{item.distanceKm ?? "-"} km delivery</Text>
                    <Text style={styles.metric}>Stage {item.stage}</Text>
                  </View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => acceptOffer(item)} disabled={busy}>
                      <Text style={styles.primaryText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => rejectOffer(item)} disabled={busy}>
                      <Text style={styles.secondaryText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Selected Job</Text>
            {activeOrder && <Text style={styles.sectionMeta}>{label(activeOrder.status)}</Text>}
          </View>
          {!activeOrder ? (
            <View style={styles.emptyCard}>
              <Ionicons name="albums-outline" size={24} color={theme.tertiaryText} />
              <Text style={styles.muted}>Select an active job to manage checkpoints.</Text>
            </View>
          ) : (
            <View style={styles.jobCard}>
              <View style={styles.offerTop}>
                <View>
                  <Text style={styles.offerId}>{activeOrder.subOrderId}</Text>
                  <Text style={styles.statusText}>{label(activeOrder.status)}</Text>
                </View>
                <Text style={styles.payout}>{money(activeOrder.delivery?.payoutAmount)}</Text>
              </View>

              {activeOrder.status === "RIDER_REACHED_STORE" && (() => {
                const proof = proofFor(activeOrder.subOrderId);
                return (
                <View style={styles.formBlock}>
                  <TextInput
                    style={styles.input}
                    value={proof.pickupOtp}
                    onChangeText={(value) => updateProof(activeOrder.subOrderId, { pickupOtp: value })}
                    placeholder="Pickup OTP"
                    placeholderTextColor={theme.secondaryText}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity style={styles.secondaryButton} onPress={async () => updateProof(activeOrder.subOrderId, { pickupPhoto: await pickProofPhoto(showDialog) })}>
                    <Text style={styles.secondaryText}>{proof.pickupPhoto ? "Pickup Photo Added" : "Add Pickup Photo"}</Text>
                  </TouchableOpacity>
                </View>
                );
              })()}

              {activeOrder.status === "NEAR_CUSTOMER" && (() => {
                const proof = proofFor(activeOrder.subOrderId);
                return (
                <View style={styles.formBlock}>
                  <TextInput
                    style={styles.input}
                    value={proof.deliveryOtp}
                    onChangeText={(value) => updateProof(activeOrder.subOrderId, { deliveryOtp: value })}
                    placeholder="Delivery OTP"
                    placeholderTextColor={theme.secondaryText}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity style={styles.secondaryButton} onPress={async () => updateProof(activeOrder.subOrderId, { deliveryPhoto: await pickProofPhoto(showDialog) })}>
                    <Text style={styles.secondaryText}>{proof.deliveryPhoto ? "Delivery Photo Added" : "Add Delivery Photo"}</Text>
                  </TouchableOpacity>
                </View>
                );
              })()}

              {nextAction && activeStatuses.includes(activeOrder.status) && (
                <TouchableOpacity style={styles.primaryButton} onPress={() => runAction(nextAction.run)} disabled={busy}>
                  <Text style={styles.primaryText}>{busy ? "Working..." : nextAction.label}</Text>
                </TouchableOpacity>
              )}

              {!["PICKED_UP", "IN_TRANSIT", "NEAR_CUSTOMER", "DELIVERED", "COMPLETED"].includes(activeOrder.status) && (
                <TouchableOpacity style={styles.cancelButton} onPress={() => runAction(() => deliveryApi.cancel(activeOrder.subOrderId, "Rider unavailable"))} disabled={busy}>
                  <Text style={styles.cancelText}>Cancel Before Pickup</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      {dialogView}
    </SafeViewWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: { padding: 18, paddingBottom: 118 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 18,
    },
    eyebrow: {
      color: theme.primary,
      fontWeight: "700",
      fontSize: 12,
      textTransform: "uppercase",
    },
    title: { color: theme.text, fontSize: 24, fontWeight: "800", marginTop: 2 },
    muted: { color: theme.secondaryText, fontSize: 13, lineHeight: 18 },
    statusButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.text,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 14,
      opacity: 1,
    },
    statusOnline: { backgroundColor: theme.primary },
    statusButtonText: { color: theme.background, fontWeight: "800" },
    statusOnlineText: { color: "#fff" },
    codCard: {
      backgroundColor: theme.warning + "16",
      borderColor: theme.warning + "55",
      borderWidth: 1,
      padding: 16,
      borderRadius: 16,
      marginBottom: 18,
    },
    codLabel: { color: theme.warning, fontWeight: "700", fontSize: 12 },
    codAmount: { color: theme.text, fontSize: 24, fontWeight: "900", marginTop: 4 },
    codCopy: { color: theme.secondaryText, fontSize: 12, marginTop: 4, lineHeight: 17 },
    summaryGrid: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    summaryTile: {
      flex: 1,
      backgroundColor: theme.secondaryBackground,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 12,
      minHeight: 72,
      justifyContent: "center",
    },
    summaryValue: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "900",
    },
    summaryLabel: {
      color: theme.secondaryText,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 4,
    },
    capacityBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      backgroundColor: theme.primary + "12",
      borderWidth: 1,
      borderColor: theme.primary + "35",
      borderRadius: 14,
      padding: 12,
      marginBottom: 4,
    },
    capacityTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 2,
    },
    capacityPill: {
      color: "#fff",
      backgroundColor: theme.primary,
      overflow: "hidden",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 12,
      fontWeight: "900",
    },
    section: { marginTop: 14 },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 10,
    },
    sectionTitle: { color: theme.text, fontSize: 17, fontWeight: "800" },
    sectionMeta: {
      color: theme.secondaryText,
      fontSize: 12,
      fontWeight: "800",
    },
    jobTabs: {
      gap: 10,
      paddingRight: 18,
    },
    jobTab: {
      width: 178,
      minHeight: 78,
      justifyContent: "center",
      backgroundColor: theme.secondaryBackground,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    jobTabSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + "12",
    },
    jobTabId: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "900",
    },
    jobTabIdSelected: {
      color: theme.primary,
    },
    jobTabStatus: {
      color: theme.secondaryText,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 5,
    },
    jobTabStatusSelected: {
      color: theme.text,
    },
    emptyCard: {
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.secondaryBackground,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      borderRadius: 16,
    },
    offerCard: {
      backgroundColor: theme.secondaryBackground,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      borderRadius: 16,
      marginBottom: 10,
      ...cardShadow(theme),
    },
    jobCard: {
      backgroundColor: theme.secondaryBackground,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      borderRadius: 16,
      gap: 12,
      ...cardShadow(theme),
    },
    offerTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
    offerId: { color: theme.text, fontSize: 16, fontWeight: "800", flexShrink: 1 },
    payout: { color: theme.primary, fontSize: 18, fontWeight: "900" },
    metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
    metric: {
      color: theme.secondaryText,
      backgroundColor: theme.tertiaryBackground,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 10,
      fontSize: 12,
      overflow: "hidden",
    },
    actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    primaryButton: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      flex: 1,
      minHeight: 46,
    },
    primaryText: { color: "#fff", fontWeight: "900" },
    secondaryButton: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      flex: 1,
      minHeight: 46,
    },
    secondaryText: { color: theme.text, fontWeight: "800" },
    cancelButton: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.error + "55",
      backgroundColor: theme.error + "10",
      paddingVertical: 12,
      borderRadius: 14,
      minHeight: 46,
    },
    cancelText: { color: theme.error, fontWeight: "800" },
    statusText: { color: theme.primary, fontSize: 13, fontWeight: "800", marginTop: 2 },
    formBlock: { gap: 10 },
    input: {
      backgroundColor: theme.background,
      color: theme.text,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 15,
      minHeight: 48,
    },
  });

const cardShadow = (theme: Theme) =>
  Platform.select({
    ios: {
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
    },
    android: {
      elevation: 2,
    },
    default: {},
  });
