import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SocketEvents } from "@/src/constants/socketEvents";
import { socketClient } from "@/src/lib/socket";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import {
  deliveryApi,
  type RiderDashboardResponse,
  type RiderEarningsResponse,
  type RiderOffer,
  type RiderOrder,
  type RiderOrderStatus,
  type RiderPayoutMethod,
  type RiderPayoutsResponse,
  type RiderProfile,
} from "../api/delivery.api";
import { RiderHeader } from "../components/rider/RiderHeader";
import { RiderTabs } from "../components/rider/RiderTabs";
import { OverviewPanel } from "../components/rider/OverviewPanel";
import { JobsPanel } from "../components/rider/JobsPanel";
import { HistoryPanel } from "../components/rider/HistoryPanel";
import { EarningsPanel } from "../components/rider/EarningsPanel";
import { ProfilePanel } from "../components/rider/ProfilePanel";
import { createRiderStyles } from "../styles/rider.styles";
import {
  emptyProfileForm,
  emptyProof,
  errorMessage,
  approvalSensitiveProfileChanged,
  isoDateDaysAgo,
  isoToday,
  missingProfileFieldsFromForm,
  money,
  normalizedOffer,
  profileToForm,
  riderCanAcceptOffers,
  riderOfferBlockReason,
  storeNameOf,
  subOrderIdOf,
  type RiderHistoryStatus,
} from "../theme/riderTheme";
import { currentLocation, notifyLocalOffer } from "../utils/riderMedia";
import type { ProfileForm, ProofState, RiderDialog, RiderTab, ShowDialog } from "../types/rider.types";

export default function RiderWorkspaceScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createRiderStyles(theme), [theme]) as any;
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<RiderTab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dashboard, setDashboard] = useState<RiderDashboardResponse | null>(null);
  const [offers, setOffers] = useState<RiderOffer[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [history, setHistory] = useState<RiderOrder[]>([]);
  const [historyMeta, setHistoryMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [historyStatus, setHistoryStatus] = useState<RiderHistoryStatus>("ALL");
  const [historyDateFrom, setHistoryDateFrom] = useState(isoDateDaysAgo(6));
  const [historyDateTo, setHistoryDateTo] = useState(isoToday());
  const [earnings, setEarnings] = useState<RiderEarningsResponse | null>(null);
  const [payouts, setPayouts] = useState<RiderPayoutsResponse | null>(null);
  const [earningsDateFrom, setEarningsDateFrom] = useState(isoToday());
  const [earningsDateTo, setEarningsDateTo] = useState(isoToday());
  const [proofByOrder, setProofByOrder] = useState<Record<string, ProofState>>({});
  const [dialog, setDialog] = useState<RiderDialog | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [payoutType, setPayoutType] = useState<"UPI" | "BANK">("UPI");
  const [methodLabel, setMethodLabel] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestMethodId, setRequestMethodId] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const notifiedOfferIds = useRef<Set<string>>(new Set());

  const isOnline = Boolean(profile?.isOnline);
  const wallet = payouts?.wallet || earnings?.wallet || profile?.wallet || dashboard?.profile?.wallet;
  const codLiability = Number(wallet?.collectedCodLiability || 0);
  const activeOrder = useMemo(
    () => activeOrders.find((order) => subOrderIdOf(order) === selectedJobId) || activeOrders[0] || null,
    [activeOrders, selectedJobId],
  );
  const currentCapacity = (offers.find((offer: any) => offer?.riderCapacity) as any)?.riderCapacity;
  const totalOpenValue = offers.reduce((sum, offer) => sum + Number(offer.payoutAmount || 0), 0);
  const payoutRequestMethods = payouts?.payoutMethods || [];
  const persistedProfileForm = profileToForm(profile);
  const profileMissingFields = missingProfileFieldsFromForm(profileForm);
  const canAcceptOffers = profile?.canAcceptOffers ?? riderCanAcceptOffers(profile, persistedProfileForm);
  const requiresApprovalAfterSave = approvalSensitiveProfileChanged(profile, profileForm);
  const profileBlockReason = profile?.offerBlockReason || riderOfferBlockReason(profile, persistedProfileForm);

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

  useEffect(() => {
    setProfileForm(profileToForm(profile));
  }, [profile]);

  useEffect(() => {
    const boot = async () => {
      try {
        if (token && !socketClient.isConnected) {
          socketClient.connect(token);
        }
        await refreshAll(false);
      } catch (error: any) {
        showDialog("Rider Sync Failed", errorMessage(error, "Could not load rider dashboard."));
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (!socketClient.isConnected) {
      socketClient.connect(token);
    }

    const onOffer = (offer: RiderOffer) => {
      if (!canAcceptOffers) {
        setOffers([]);
        return;
      }
      const nextOffer = normalizedOffer(offer);
      setOffers((current) => [nextOffer, ...current.filter((item) => item.offerId !== nextOffer.offerId)]);
      promptOffer(nextOffer);
    };
    const onRefresh = () => {
      refreshAll(false).catch(() => undefined);
    };

    socketClient.on(SocketEvents.RIDER_JOB_OFFER, onOffer);
    socketClient.on(SocketEvents.FULFILLMENT_EVENT, onRefresh);
    socketClient.on(SocketEvents.ORDER_STATUS_UPDATE, onRefresh);
    return () => {
      socketClient.off(SocketEvents.RIDER_JOB_OFFER, onOffer);
      socketClient.off(SocketEvents.FULFILLMENT_EVENT, onRefresh);
      socketClient.off(SocketEvents.ORDER_STATUS_UPDATE, onRefresh);
    };
  }, [token, canAcceptOffers, historyStatus, historyDateFrom, historyDateTo, earningsDateFrom, earningsDateTo]);

  useEffect(() => {
    if (loading) return;
    loadHistory(1, false).catch(() => undefined);
  }, [historyStatus, historyDateFrom, historyDateTo]);

  useEffect(() => {
    if (loading) return;
    loadEarnings().catch(() => undefined);
  }, [earningsDateFrom, earningsDateTo]);

  async function refreshAll(showSpinner = true) {
    if (showSpinner) setRefreshing(true);
    try {
      await Promise.all([loadBase(), loadHistory(1, false), loadEarnings()]);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }

  async function loadBase() {
    const [nextDashboard, sync, openOffers] = await Promise.all([
      deliveryApi.getDashboard(),
      deliveryApi.sync(),
      deliveryApi.getOffers(),
    ]);
    const nextActiveOrders = sync?.activeOrders || (sync?.activeOrder ? [sync.activeOrder] : []);
    const nextProfile = nextDashboard?.profile
      ? {
        ...nextDashboard.profile,
        isOnline: sync?.profile?.isOnline ?? nextDashboard.profile.isOnline,
        currentLocation: sync?.profile?.currentLocation ?? nextDashboard.profile.currentLocation,
        wallet: sync?.profile?.wallet || nextDashboard.profile.wallet,
      }
      : sync?.profile || null;
    const nextCanAcceptOffers = nextProfile?.canAcceptOffers ?? riderCanAcceptOffers(nextProfile, profileToForm(nextProfile));
    const nextOffers = nextCanAcceptOffers ? (openOffers || []).map(normalizedOffer) : [];

    setDashboard(nextDashboard);
    setProfile(nextProfile);
    setActiveOrders(nextActiveOrders);
    setSelectedJobId((current) =>
      current && nextActiveOrders.some((order: any) => subOrderIdOf(order) === current)
        ? current
        : subOrderIdOf(nextActiveOrders[0]) || null,
    );
    setOffers(nextOffers);
    if (nextCanAcceptOffers && nextOffers.length) {
      promptOffer(nextOffers[0], nextCanAcceptOffers);
    }
  }

  async function loadHistory(page = 1, append = false) {
    const response = await deliveryApi.getHistory({
      status: historyStatus === "ALL" ? undefined : historyStatus,
      dateFrom: historyDateFrom || undefined,
      dateTo: historyDateTo || undefined,
      page,
      limit: 20,
    });
    setHistory((current) => (append ? [...current, ...(response.data || [])] : response.data || []));
    setHistoryMeta({ page: response.page, totalPages: response.totalPages, total: response.total });
  }

  async function loadEarnings() {
    const [nextEarnings, nextPayouts] = await Promise.all([
      deliveryApi.getEarnings({
        dateFrom: earningsDateFrom || undefined,
        dateTo: earningsDateTo || undefined,
      }),
      deliveryApi.getPayouts(),
    ]);
    setEarnings(nextEarnings);
    setPayouts(nextPayouts);
    const nextVerifiedMethods = nextPayouts.payoutMethods.filter((method) => method.status === "VERIFIED");
    const defaultMethod = nextVerifiedMethods.find((method) => method.isDefault) || nextVerifiedMethods[0];
    const currentMethodStillVerified = nextVerifiedMethods.some((method) => method._id === requestMethodId);
    if (defaultMethod && (!requestMethodId || !currentMethodStillVerified)) {
      setRequestMethodId(defaultMethod._id);
    }
  }

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

  function promptOffer(offer: RiderOffer, allowAccept = canAcceptOffers) {
    if (!offer?.offerId || notifiedOfferIds.current.has(offer.offerId)) return;
    if (!allowAccept) {
      setOffers([]);
      return;
    }

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
    if (shouldAccept && !canAcceptOffers) {
      setActiveTab("profile");
      showDialog("Complete Profile First", profileBlockReason);
      return Promise.resolve();
    }
    return runAction(async () => {
      if (shouldAccept) {
        await deliveryApi.acceptOffer(offer.offerId);
      } else {
        await deliveryApi.rejectOffer(offer.offerId);
      }
    });
  }

  const runAction = async (action: () => Promise<any>, successMessage?: string) => {
    try {
      setBusy(true);
      await action();
      await refreshAll(false);
      if (successMessage) showDialog("Success", successMessage);
    } catch (error: any) {
      showDialog("Action Failed", errorMessage(error, "Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const toggleOnline = async () => {
    try {
      const nextOnline = !isOnline;
      if (nextOnline && !canAcceptOffers) {
        setActiveTab("profile");
        showDialog("Complete Profile First", profileBlockReason);
        return;
      }
      setBusy(true);
      const location = await currentLocation();
      if (nextOnline && !location) {
        throw new Error("Location permission is required before you can receive delivery offers.");
      }
      await deliveryApi.updateAvailability({ isOnline: nextOnline, location });
      await refreshAll(false);
      if (nextOnline) {
        setTimeout(() => refreshAll(false).catch(() => undefined), 1500);
      }
    } catch (error: any) {
      showDialog("Availability Failed", errorMessage(error, "Could not update duty status."));
    } finally {
      setBusy(false);
    }
  };

  const submitPayoutMethod = async () => {
    await runAction(async () => {
      if (payoutType === "UPI") {
        if (!upiId.trim()) throw new Error("UPI ID is required.");
        await deliveryApi.addPayoutMethod({
          type: "UPI",
          label: methodLabel.trim() || undefined,
          upi: { upiId: upiId.trim() },
        });
      } else {
        if (!accountHolderName.trim() || !accountNumber.trim() || !ifsc.trim() || !bankName.trim()) {
          throw new Error("All bank account fields are required.");
        }
        await deliveryApi.addPayoutMethod({
          type: "BANK",
          label: methodLabel.trim() || undefined,
          bank: {
            accountHolderName: accountHolderName.trim(),
            accountNumber: accountNumber.trim(),
            ifsc: ifsc.trim(),
            bankName: bankName.trim(),
          },
        });
      }
      setMethodLabel("");
      setUpiId("");
      setAccountHolderName("");
      setAccountNumber("");
      setIfsc("");
      setBankName("");
    }, "Payout method submitted for admin verification.");
  };

  const requestPayout = async () => {
    await runAction(async () => {
      const amount = Number(requestAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid payout amount.");
      const selectedMethod = (payouts?.payoutMethods || []).find((method) => method._id === requestMethodId);
      if (!selectedMethod || selectedMethod.status !== "VERIFIED") throw new Error("Select a verified payout method.");
      await deliveryApi.requestPayout({
        amount,
        payoutMethodId: requestMethodId,
        note: requestNote.trim() || undefined,
      });
      setRequestAmount("");
      setRequestNote("");
    }, "Payout request submitted.");
  };

  const saveProfile = async () => {
    const missingFields = missingProfileFieldsFromForm(profileForm);
    if (missingFields.length) {
      showDialog("Complete Profile First", `Missing: ${missingFields.join(", ")}.`);
      return;
    }
    const approvalRequired = !canAcceptOffers || requiresApprovalAfterSave;
    await runAction(async () => {
      const updatedProfile = await deliveryApi.updateProfile({
        phone: profileForm.phone.trim() || undefined,
        vehicleType: profileForm.vehicleType.trim() || undefined,
        vehicleNumber: profileForm.vehicleNumber.trim() || undefined,
        licenseNumber: profileForm.licenseNumber.trim() || undefined,
        address: {
          address: profileForm.address.trim(),
          city: profileForm.city.trim(),
          state: profileForm.state.trim(),
          pincode: profileForm.pincode.trim(),
        },
        bankDetails: {
          accountNumber: profileForm.accountNumber.trim(),
          ifsc: profileForm.ifsc.trim(),
          bankName: profileForm.bankName.trim(),
          pan: profileForm.pan.trim(),
          upi: profileForm.upi.trim(),
          aadhar: profileForm.aadhar.trim(),
        },
      });
      setProfile(updatedProfile);
    }, approvalRequired ? "Profile submitted for admin approval." : "Profile updated.");
  };

  const updateProfileField = (key: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [key]: value }));
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
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refreshAll(true).catch(() => undefined)}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          <RiderHeader styles={styles} theme={theme} profile={profile} isOnline={isOnline} busy={busy} onToggleOnline={toggleOnline} />
          <RiderTabs styles={styles} theme={theme} activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "overview" && (
            <OverviewPanel
              styles={styles}
              theme={theme}
              dashboard={dashboard}
              profile={profile}
              wallet={wallet}
              codLiability={codLiability}
              activeOrders={activeOrders}
              onTab={setActiveTab}
            />
          )}
          {activeTab === "jobs" && (
            <JobsPanel
              styles={styles}
              theme={theme}
              activeOrders={activeOrders}
              offers={offers}
              activeOrder={activeOrder}
              currentCapacity={currentCapacity}
              totalOpenValue={totalOpenValue}
              busy={busy}
              selectedJobId={selectedJobId}
              canAcceptOffers={canAcceptOffers}
              profileBlockReason={profileBlockReason}
              onSelectJob={setSelectedJobId}
              onOfferResponse={handleOfferResponse}
              runAction={runAction}
              proofFor={proofFor}
              updateProof={updateProof}
              showDialog={showDialog}
            />
          )}
          {activeTab === "history" && (
            <HistoryPanel
              styles={styles}
              theme={theme}
              history={history}
              historyMeta={historyMeta}
              historyStatus={historyStatus as "ALL" | RiderOrderStatus}
              historyDateFrom={historyDateFrom}
              historyDateTo={historyDateTo}
              busy={busy}
              onStatusChange={setHistoryStatus}
              onDateFromChange={setHistoryDateFrom}
              onDateToChange={setHistoryDateTo}
              onLoadMore={() => loadHistory(historyMeta.page + 1, true)}
            />
          )}
          {activeTab === "earnings" && (
            <EarningsPanel
              styles={styles}
              theme={theme}
              earnings={earnings}
              payouts={payouts}
              wallet={wallet}
              payoutRequestMethods={payoutRequestMethods as RiderPayoutMethod[]}
              earningsDateFrom={earningsDateFrom}
              earningsDateTo={earningsDateTo}
              payoutType={payoutType}
              methodLabel={methodLabel}
              upiId={upiId}
              accountHolderName={accountHolderName}
              accountNumber={accountNumber}
              ifsc={ifsc}
              bankName={bankName}
              requestAmount={requestAmount}
              requestMethodId={requestMethodId}
              requestNote={requestNote}
              busy={busy}
              onEarningsDateFromChange={setEarningsDateFrom}
              onEarningsDateToChange={setEarningsDateTo}
              onPayoutTypeChange={setPayoutType}
              onMethodLabelChange={setMethodLabel}
              onUpiIdChange={setUpiId}
              onAccountHolderNameChange={setAccountHolderName}
              onAccountNumberChange={setAccountNumber}
              onIfscChange={setIfsc}
              onBankNameChange={setBankName}
              onRequestAmountChange={setRequestAmount}
              onRequestMethodIdChange={setRequestMethodId}
              onRequestNoteChange={setRequestNote}
              onSubmitPayoutMethod={submitPayoutMethod}
              onRequestPayout={requestPayout}
              onSetDefault={(methodId) => runAction(() => deliveryApi.setDefaultPayoutMethod(methodId), "Default payout method updated.")}
            />
          )}
          {activeTab === "profile" && (
            <ProfilePanel
              styles={styles}
              theme={theme}
              profile={profile}
              profileForm={profileForm}
              missingFields={profileMissingFields}
              canAcceptOffers={canAcceptOffers}
              requiresApprovalAfterSave={requiresApprovalAfterSave}
              busy={busy}
              onFieldChange={updateProfileField}
              onSaveProfile={saveProfile}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      {dialogView}
    </SafeViewWrapper>
  );
}
