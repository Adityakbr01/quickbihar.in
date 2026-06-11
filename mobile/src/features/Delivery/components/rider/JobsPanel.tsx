import React from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import { deliveryApi, type RiderOffer } from "../../api/delivery.api";
import { activeStatuses, label, money, subOrderIdOf } from "../../theme/riderTheme";
import { currentLocation, pickProofPhoto } from "../../utils/riderMedia";
import type { ProofState, RiderStyles, ShowDialog } from "../../types/rider.types";
import { EmptyCard, ProofImages, SectionTitle, SummaryTile } from "./RiderShared";

type RunAction = (action: () => Promise<any>, successMessage?: string) => Promise<void>;

export function JobsPanel({
  styles,
  theme,
  activeOrders,
  offers,
  activeOrder,
  currentCapacity,
  totalOpenValue,
  busy,
  selectedJobId,
  canAcceptOffers,
  profileBlockReason,
  onSelectJob,
  onOfferResponse,
  runAction,
  proofFor,
  updateProof,
  showDialog,
}: {
  styles: RiderStyles;
  theme: Theme;
  activeOrders: any[];
  offers: RiderOffer[];
  activeOrder: any | null;
  currentCapacity: any;
  totalOpenValue: number;
  busy: boolean;
  selectedJobId: string | null;
  canAcceptOffers: boolean;
  profileBlockReason: string;
  onSelectJob: (jobId: string) => void;
  onOfferResponse: (offer: RiderOffer, shouldAccept: boolean) => void;
  runAction: RunAction;
  proofFor: (subOrderId: string) => ProofState;
  updateProof: (subOrderId: string, patch: Partial<ProofState>) => void;
  showDialog: ShowDialog;
}) {
  const nextAction = actionFor(activeOrder, proofFor);

  return (
    <View style={styles.panel}>
      {currentCapacity && (
        <View style={styles.capacityBar}>
          <View style={styles.flexOne}>
            <Text style={styles.capacityTitle}>Acceptance Capacity</Text>
            <Text style={styles.muted}>
              {currentCapacity.acceptedCountInWindow || 0}/{currentCapacity.maxAcceptedOrders || 15} accepted in {currentCapacity.acceptanceWindowHours || 12}h
            </Text>
          </View>
          <Text style={styles.capacityPill}>{currentCapacity.remainingAfterAccept ?? "-"} left</Text>
        </View>
      )}

      <View style={styles.summaryGrid}>
        <SummaryTile styles={styles} label="Active Jobs" value={String(activeOrders.length)} />
        <SummaryTile styles={styles} label="Open Offers" value={String(offers.length)} />
        <SummaryTile styles={styles} label="Offer Value" value={money(totalOpenValue)} />
      </View>

      <SectionTitle styles={styles} title="Active Queue" meta={`${activeOrders.length} jobs`} />
      {activeOrders.length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon="cube-outline" label="No active delivery assigned." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobTabs}>
          {activeOrders.map((order) => {
            const jobId = subOrderIdOf(order);
            const selected = selectedJobId === jobId;
            return (
              <TouchableOpacity
                key={jobId}
                style={[styles.jobTab, selected && styles.jobTabSelected]}
                onPress={() => onSelectJob(jobId)}
                activeOpacity={0.8}
              >
                <Text style={[styles.jobTabId, selected && styles.jobTabIdSelected]} numberOfLines={1}>
                  {jobId}
                </Text>
                <Text style={[styles.jobTabStatus, selected && styles.jobTabStatusSelected]} numberOfLines={1}>
                  {label(order.status)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <SectionTitle styles={styles} title="Offer Queue" meta={`${offers.length} waiting`} />
      {!canAcceptOffers ? (
        <View style={[styles.noticeCard, styles.noticeWarning]}>
          <View style={styles.rowBetween}>
            <View style={styles.flexOne}>
              <Text style={styles.noticeTitle}>Complete Profile First</Text>
              <Text style={styles.noticeCopy}>{profileBlockReason}</Text>
            </View>
            <Ionicons name="lock-closed-outline" size={20} color={theme.warning} />
          </View>
        </View>
      ) : offers.length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon="notifications-off-outline" label="No active rider offers right now." />
      ) : (
        offers.map((item) => (
          <View key={item.offerId} style={styles.offerCard}>
            <View style={styles.offerTop}>
              <View style={styles.flexOne}>
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
              <TouchableOpacity style={styles.primaryButton} onPress={() => onOfferResponse(item, true)} disabled={busy}>
                <Text style={styles.primaryText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => onOfferResponse(item, false)} disabled={busy}>
                <Text style={styles.secondaryText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <SectionTitle styles={styles} title="Selected Job" meta={activeOrder ? label(activeOrder.status) : ""} />
      {!activeOrder ? (
        <EmptyCard styles={styles} theme={theme} icon="albums-outline" label="Select an active job to manage checkpoints." />
      ) : (
        <SelectedJobCard
          styles={styles}
          theme={theme}
          order={activeOrder}
          proofFor={proofFor}
          updateProof={updateProof}
          showDialog={showDialog}
          nextAction={nextAction}
          runAction={runAction}
          busy={busy}
        />
      )}
    </View>
  );
}

function SelectedJobCard({
  styles,
  theme,
  order,
  proofFor,
  updateProof,
  showDialog,
  nextAction,
  runAction,
  busy,
}: {
  styles: RiderStyles;
  theme: Theme;
  order: any;
  proofFor: (subOrderId: string) => ProofState;
  updateProof: (subOrderId: string, patch: Partial<ProofState>) => void;
  showDialog: ShowDialog;
  nextAction: { label: string; run: () => Promise<any> } | null;
  runAction: RunAction;
  busy: boolean;
}) {
  const jobId = subOrderIdOf(order);
  const proof = proofFor(jobId);
  const pickupPhoto = proof.pickupPhoto || order.delivery?.pickupPhoto;
  const deliveryPhoto = proof.deliveryPhoto || order.delivery?.deliveryPhoto;

  return (
    <View style={styles.jobCard}>
      <View style={styles.offerTop}>
        <View style={styles.flexOne}>
          <Text style={styles.offerId}>{jobId}</Text>
          <Text style={styles.statusText}>{label(order.status)}</Text>
        </View>
        <Text style={styles.payout}>{money(order.delivery?.payoutAmount)}</Text>
      </View>

      <ProofImages styles={styles} pickupPhoto={pickupPhoto} deliveryPhoto={deliveryPhoto} />

      {order.status === "RIDER_REACHED_STORE" && (
        <View style={styles.formBlock}>
          <TextInput
            style={styles.input}
            value={proof.pickupOtp}
            onChangeText={(value) => updateProof(jobId, { pickupOtp: value })}
            placeholder="Pickup OTP"
            placeholderTextColor={theme.secondaryText}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={async () => updateProof(jobId, { pickupPhoto: await pickProofPhoto(showDialog) })}>
            <Ionicons name="camera-outline" size={16} color={theme.text} />
            <Text style={styles.secondaryText}>{proof.pickupPhoto ? "Pickup Photo Added" : "Add Pickup Photo"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === "NEAR_CUSTOMER" && (
        <View style={styles.formBlock}>
          <TextInput
            style={styles.input}
            value={proof.deliveryOtp}
            onChangeText={(value) => updateProof(jobId, { deliveryOtp: value })}
            placeholder="Delivery OTP"
            placeholderTextColor={theme.secondaryText}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={async () => updateProof(jobId, { deliveryPhoto: await pickProofPhoto(showDialog) })}>
            <Ionicons name="camera-outline" size={16} color={theme.text} />
            <Text style={styles.secondaryText}>{proof.deliveryPhoto ? "Delivery Photo Added" : "Add Delivery Photo"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {nextAction && activeStatuses.includes(order.status) && (
        <TouchableOpacity style={styles.primaryButton} onPress={() => runAction(nextAction.run)} disabled={busy}>
          <Text style={styles.primaryText}>{busy ? "Working..." : nextAction.label}</Text>
        </TouchableOpacity>
      )}

      {!["PICKED_UP", "IN_TRANSIT", "NEAR_CUSTOMER", "DELIVERED", "COMPLETED"].includes(order.status) && (
        <TouchableOpacity style={styles.cancelButton} onPress={() => runAction(() => deliveryApi.cancel(jobId, "Rider unavailable"))} disabled={busy}>
          <Text style={styles.cancelText}>Cancel Before Pickup</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function actionFor(order: any, proofFor: (subOrderId: string) => ProofState) {
  if (!order) return null;
  const requireLocation = async () => {
    const location = await currentLocation();
    if (!location) {
      throw new Error("Location permission is required for this rider checkpoint.");
    }
    return location;
  };
  const status = order.status;
  const subOrderId = subOrderIdOf(order);
  const proof = proofFor(subOrderId);
  if (status === "RIDER_ASSIGNED") return { label: "Start To Store", run: () => deliveryApi.arriving(subOrderId) };
  if (status === "RIDER_ARRIVING") return { label: "Reached Store", run: async () => deliveryApi.reachedStore(subOrderId, await requireLocation()) };
  if (status === "RIDER_REACHED_STORE") {
    return {
      label: "Verify Pickup",
      run: () => {
        if (!proof.pickupOtp || !proof.pickupPhoto) throw new Error("Pickup OTP and pickup photo are required.");
        return deliveryApi.pickup(subOrderId, { pickupOtp: proof.pickupOtp, pickupPhoto: proof.pickupPhoto });
      },
    };
  }
  if (status === "PICKED_UP") return { label: "Start Transit", run: () => deliveryApi.transit(subOrderId) };
  if (status === "IN_TRANSIT") return { label: "Near Customer", run: async () => deliveryApi.nearCustomer(subOrderId, await requireLocation()) };
  if (status === "NEAR_CUSTOMER") {
    return {
      label: "Complete Delivery",
      run: () => {
        if (!proof.deliveryOtp || !proof.deliveryPhoto) throw new Error("Delivery OTP and delivery photo are required.");
        return deliveryApi.deliver(subOrderId, { deliveryOtp: proof.deliveryOtp, deliveryPhoto: proof.deliveryPhoto });
      },
    };
  }
  return null;
}
