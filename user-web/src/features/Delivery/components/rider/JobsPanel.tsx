import React from "react";
import { BellOff, Box, Camera, Layers, Lock } from "lucide-react";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import { TextInput } from "@/src/theme/components/TextInput";
import { deliveryApi, type RiderOffer } from "../../api/delivery.api";
import { activeStatuses, label, money, subOrderIdOf } from "../../theme/riderTheme";
import { currentLocation, pickProofPhoto } from "../../utils/riderMedia";
import type { ProofState, RiderStyles, ShowDialog } from "../../types/rider.types";
import { EmptyCard, ProofImages, SectionTitle, SummaryTile } from "./RiderShared";
import { cn } from "@/src/lib/utils";

const riderInputChrome = (theme: Theme) => ({
  containerStyle: { marginBottom: 0 },
  inputContainerStyle: {
    backgroundColor: theme.background,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 48,
  },
  style: { fontSize: 15, color: theme.text },
});

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
  void styles;
  const nextAction = actionFor(activeOrder, proofFor);

  return (
    <div className="flex flex-col gap-3.5">
      {currentCapacity && (
        <div
          className="flex flex-row items-center justify-between gap-2.5 rounded-[14px] border p-3"
          style={{ backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}35` }}
        >
          <div className="min-w-0 flex-1">
            <span className="mb-0.5 block text-[13px] font-extrabold" style={{ color: theme.text }}>
              Acceptance Capacity
            </span>
            <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
              {currentCapacity.acceptedCountInWindow || 0}/{currentCapacity.maxAcceptedOrders || 15} accepted in {currentCapacity.acceptanceWindowHours || 12}h
            </span>
          </div>
          <span className="rounded-full px-2.5 py-1.5 text-xs font-black text-white" style={{ backgroundColor: theme.primary }}>
            {currentCapacity.remainingAfterAccept ?? "-"} left
          </span>
        </div>
      )}

      <div className="flex flex-row gap-2.5">
        <SummaryTile styles={styles} label="Active Jobs" value={String(activeOrders.length)} />
        <SummaryTile styles={styles} label="Open Offers" value={String(offers.length)} />
        <SummaryTile styles={styles} label="Offer Value" value={money(totalOpenValue)} />
      </div>

      <SectionTitle styles={styles} title="Active Queue" meta={`${activeOrders.length} jobs`} />
      {activeOrders.length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon={Box} label="No active delivery assigned." />
      ) : (
        <div className="flex flex-row gap-2.5 overflow-x-auto pr-[18px]">
          {activeOrders.map((order) => {
            const jobId = subOrderIdOf(order);
            const selected = selectedJobId === jobId;
            return (
              <button
                key={jobId}
                type="button"
                onClick={() => onSelectJob(jobId)}
                className="flex min-h-[78px] w-[178px] shrink-0 cursor-pointer flex-col justify-center rounded-[14px] border p-3 text-left"
                style={{
                  backgroundColor: selected ? `${theme.primary}12` : theme.secondaryBackground,
                  borderColor: selected ? theme.primary : theme.border,
                }}
              >
                <span
                  className={cn("line-clamp-1 block truncate text-[13px] font-black")}
                  style={{ color: selected ? theme.primary : theme.text }}
                >
                  {jobId}
                </span>
                <span
                  className="mt-1 line-clamp-1 block truncate text-xs font-bold"
                  style={{ color: selected ? theme.text : theme.secondaryText }}
                >
                  {label(order.status)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <SectionTitle styles={styles} title="Offer Queue" meta={`${offers.length} waiting`} />
      {!canAcceptOffers ? (
        <div
          className="flex flex-col gap-2.5 rounded-2xl border p-3.5"
          style={{ backgroundColor: `${theme.warning}12`, borderColor: `${theme.warning}55` }}
        >
          <div className="flex flex-row items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <span className="mb-1 block text-sm font-black" style={{ color: theme.text }}>
                Complete Profile First
              </span>
              <span className="block text-xs leading-[17px]" style={{ color: theme.secondaryText }}>
                {profileBlockReason}
              </span>
            </div>
            <Lock size={20} color={theme.warning} />
          </div>
        </div>
      ) : offers.length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon={BellOff} label="No active rider offers right now." />
      ) : (
        offers.map((item) => (
          <div
            key={item.offerId}
            className="flex flex-col gap-2 rounded-2xl border p-3.5"
            style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
          >
            <div className="flex flex-row justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <span className="block flex-1 text-base font-extrabold" style={{ color: theme.text }}>
                  {item.subOrderId}
                </span>
                <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                  {item.metadata?.storeName || item.subOrder?.storeId?.name || "Pickup store"}
                </span>
              </div>
              <span className="text-[17px] font-black" style={{ color: theme.primary }}>
                {money(item.payoutAmount)}
              </span>
            </div>
            <div className="mt-1 flex flex-row flex-wrap gap-2">
              <span className="rounded-[10px] px-2 py-1 text-xs" style={{ color: theme.secondaryText, backgroundColor: theme.tertiaryBackground }}>
                {item.riderDistanceToStoreKm ?? "-"} km to store
              </span>
              <span className="rounded-[10px] px-2 py-1 text-xs" style={{ color: theme.secondaryText, backgroundColor: theme.tertiaryBackground }}>
                {item.distanceKm ?? "-"} km delivery
              </span>
              <span className="rounded-[10px] px-2 py-1 text-xs" style={{ color: theme.secondaryText, backgroundColor: theme.tertiaryBackground }}>
                Stage {item.stage}
              </span>
            </div>
            <div className="flex flex-row gap-2.5">
              <button
                type="button"
                onClick={() => onOfferResponse(item, true)}
                disabled={busy}
                className="flex min-h-[46px] flex-1 cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] px-3.5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: theme.primary }}
              >
                <span className="font-black text-white">Accept</span>
              </button>
              <button
                type="button"
                onClick={() => onOfferResponse(item, false)}
                disabled={busy}
                className="flex min-h-[46px] flex-1 cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] border px-3.5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: theme.background, borderColor: theme.border }}
              >
                <span className="font-extrabold" style={{ color: theme.text }}>
                  Reject
                </span>
              </button>
            </div>
          </div>
        ))
      )}

      <SectionTitle styles={styles} title="Selected Job" meta={activeOrder ? label(activeOrder.status) : ""} />
      {!activeOrder ? (
        <EmptyCard styles={styles} theme={theme} icon={Layers} label="Select an active job to manage checkpoints." />
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
    </div>
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
  void styles;
  const jobId = subOrderIdOf(order);
  const proof = proofFor(jobId);
  const pickupPhoto = proof.pickupPhoto || order.delivery?.pickupPhoto;
  const deliveryPhoto = proof.deliveryPhoto || order.delivery?.deliveryPhoto;
  const inputChrome = riderInputChrome(theme);

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-3.5"
      style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
    >
      <div className="flex flex-row justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <span className="block text-base font-extrabold" style={{ color: theme.text }}>
            {jobId}
          </span>
          <span className="mt-0.5 block text-[13px] font-extrabold" style={{ color: theme.primary }}>
            {label(order.status)}
          </span>
        </div>
        <span className="text-[17px] font-black" style={{ color: theme.primary }}>
          {money(order.delivery?.payoutAmount)}
        </span>
      </div>

      <ProofImages styles={styles} pickupPhoto={pickupPhoto} deliveryPhoto={deliveryPhoto} />

      {order.status === "RIDER_REACHED_STORE" && (
        <div className="flex flex-col gap-2.5">
          <TextInput
            {...inputChrome}
            value={proof.pickupOtp}
            onChangeText={(value: string) => updateProof(jobId, { pickupOtp: value })}
            placeholder="Pickup OTP"
            placeholderTextColor={theme.secondaryText}
            keyboardType="number-pad"
          />
          <button
            type="button"
            onClick={async () => updateProof(jobId, { pickupPhoto: await pickProofPhoto(showDialog, "pickup") })}
            className="flex min-h-[46px] w-full cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] border px-3.5 py-3"
            style={{ backgroundColor: theme.background, borderColor: theme.border }}
          >
            <Camera size={16} color={theme.text} />
            <span className="font-extrabold" style={{ color: theme.text }}>
              {proof.pickupPhoto ? "Pickup Photo Added" : "Add Pickup Photo"}
            </span>
          </button>
        </div>
      )}

      {order.status === "NEAR_CUSTOMER" && (
        <div className="flex flex-col gap-2.5">
          <TextInput
            {...inputChrome}
            value={proof.deliveryOtp}
            onChangeText={(value: string) => updateProof(jobId, { deliveryOtp: value })}
            placeholder="Delivery OTP"
            placeholderTextColor={theme.secondaryText}
            keyboardType="number-pad"
          />
          <button
            type="button"
            onClick={async () => updateProof(jobId, { deliveryPhoto: await pickProofPhoto(showDialog, "delivery") })}
            className="flex min-h-[46px] w-full cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] border px-3.5 py-3"
            style={{ backgroundColor: theme.background, borderColor: theme.border }}
          >
            <Camera size={16} color={theme.text} />
            <span className="font-extrabold" style={{ color: theme.text }}>
              {proof.deliveryPhoto ? "Delivery Photo Added" : "Add Delivery Photo"}
            </span>
          </button>
        </div>
      )}

      {nextAction && activeStatuses.includes(order.status) && (
        <button
          type="button"
          onClick={() => runAction(nextAction.run)}
          disabled={busy}
          className="flex min-h-[46px] w-full cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] px-3.5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: theme.primary }}
        >
          <span className="font-black text-white">{busy ? "Working..." : nextAction.label}</span>
        </button>
      )}

      {!["PICKED_UP", "IN_TRANSIT", "NEAR_CUSTOMER", "DELIVERED", "COMPLETED"].includes(order.status) && (
        <button
          type="button"
          onClick={() => runAction(() => deliveryApi.cancel(jobId, "Rider unavailable"))}
          disabled={busy}
          className="flex min-h-[46px] w-full cursor-pointer items-center justify-center rounded-[14px] border disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: `${theme.error}55`, backgroundColor: `${theme.error}10` }}
        >
          <span className="font-extrabold" style={{ color: theme.error }}>
            Cancel Before Pickup
          </span>
        </button>
      )}
    </div>
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
