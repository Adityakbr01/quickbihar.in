import { useEffect, useMemo, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike,
  ChevronRight,
  ClipboardList,
  History,
  LogOut,
  Power,
  RefreshCcw,
  Truck,
  UserRound,
  WalletCards,
  BellRing,
  MapPin,
  Coins,
  PackageOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SidebarFooter from "@/components/dashboard/SidebarFooter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated";
import { logoutRequest } from "@/features/auth/api/auth.api";
import { isRider } from "@/lib/rbac";
import { webSocketClient } from "@/lib/socket";
import { SocketEvents } from "@/constants/socketEvents";
import { useFulfillmentRealtime } from "@/hooks/useFulfillmentRealtime";
import { toast } from "@/lib/toast";
import {
  useDeliveryDashboard,
  useDeliveryEarnings,
  useDeliveryHistory,
  useDeliveryOrders,
  useDeliveryPayoutMutations,
  useDeliveryPayouts,
  useDeliverySetupStatus,
  useUpdateDeliveryAvailability,
  useUpdateDeliveryProfile,
  useAcceptSubOrder,
} from "@/features/delivery/hooks/useDeliveryPanel";
import { cn } from "@/lib/utils";

import { OverviewPanel } from "@/features/delivery/components/OverviewPanel";
import { ActiveOrdersPanel } from "@/features/delivery/components/ActiveOrdersPanel";
import { HistoryPanel } from "@/features/delivery/components/HistoryPanel";
import { EarningsPanel } from "@/features/delivery/components/EarningsPanel";
import { ProfilePanel } from "@/features/delivery/components/ProfilePanel";
import {
  activeStatuses,
  deliveryStatusOf,
  todayInputValue,
  formatAmount,
} from "@/features/delivery/components/DeliveryHelpers";

type DeliveryTab = "overview" | "active" | "history" | "earnings" | "profile";

const tabs: Array<{ id: DeliveryTab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "Overview", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "active", label: "Active Orders", icon: <Truck className="h-4 w-4" /> },
  { id: "history", label: "Order History", icon: <History className="h-4 w-4" /> },
  { id: "earnings", label: "Earnings", icon: <WalletCards className="h-4 w-4" /> },
  { id: "profile", label: "Profile", icon: <UserRound className="h-4 w-4" /> },
];

const deliverySectionLabels: Record<DeliveryTab, string> = {
  overview: "Overview",
  active: "Active Orders",
  history: "Order History",
  earnings: "Earnings & Payouts",
  profile: "Profile",
};

const deliveryNavigationGroups: Array<{
  title: string;
  items: Array<{ id: DeliveryTab; label: string; icon: ReactNode }>;
}> = [
  { title: "Dashboard", items: [tabs[0]] },
  { title: "Delivery", items: [tabs[1], tabs[2]] },
  { title: "Wallet", items: [tabs[3]] },
  { title: "Account", items: [tabs[4]] },
];

export default function DeliveryDashboardPage() {
  useEffect(() => { document.title = "Delivery Dashboard | QuickBihar Dashboard"; }, []);

  useFulfillmentRealtime();
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth, token } = useAuthStore();
  const hasHydrated = useAuthHydrated();
  const [activeTab, setActiveTab] = useState<DeliveryTab>("overview");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [historyStatus, setHistoryStatus] = useState<any | "ALL">("ALL");
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [earningsDateFrom, setEarningsDateFrom] = useState(todayInputValue());
  const [earningsDateTo, setEarningsDateTo] = useState(todayInputValue());
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Real-time job offer state
  const [activeJobOffer, setActiveJobOffer] = useState<any | null>(null);

  const isDeliveryUser = isRider(user);

  // persist hydration is tracked via useAuthHydrated() above.
  // Auth gating is intentionally NOT done via a client-side navigate.replace
  // here. The proxy.ts server guard already bounces visitors without an
  // accessToken cookie back to /delivery/login. For wrong-role users the
  // axios response interceptor catches the 403, clears the httpOnly cookie
  // (via /auth/logout), and then redirects — that single owner avoids the
  // ping-pong that happens if both this effect and the interceptor race to
  // redirect while the cookie is still present.

  // Setup real-time job offer socket listener
  useEffect(() => {
    if (!token) return;

    const handleJobOffer = (offer: any) => {
      console.log("[Rider Dashboard] Received real-time job offer:", offer);
      toast.success("New Job Request Nearby!", {
        description: `Payout: Rs. ${offer.payoutAmount} from ${offer.storeName}`,
        duration: 15000,
      });
      setActiveJobOffer(offer);
    };

    // Another rider accepted (or the offer expired): drop our now-stale modal
    // if it points at the same sub-order.
    const handleOfferClosed = (payload: any) => {
      setActiveJobOffer((current: any) => {
        if (!current) return current;
        const sameOffer =
          (payload?.offerId && current.offerId === payload.offerId) ||
          (payload?.subOrderId && current.subOrderId === payload.subOrderId);
        if (!sameOffer) return current;
        toast.info(payload?.message || "This delivery is no longer available.");
        return null;
      });
    };

    webSocketClient.on(SocketEvents.RIDER_JOB_OFFER, handleJobOffer);
    webSocketClient.on(SocketEvents.RIDER_OFFER_CLOSED, handleOfferClosed);
    return () => {
      webSocketClient.off(SocketEvents.RIDER_JOB_OFFER, handleJobOffer);
      webSocketClient.off(SocketEvents.RIDER_OFFER_CLOSED, handleOfferClosed);
    };
  }, [token]);

  const dashboardQuery = useDeliveryDashboard();
  const orderParams = useMemo(
    () => ({ status: statusFilter === "ALL" ? undefined : (statusFilter as any), page: 1, limit: 50 }),
    [statusFilter],
  );
  const historyParams = useMemo(
    () => ({
      status: historyStatus === "ALL" ? undefined : historyStatus,
      dateFrom: historyDateFrom || undefined,
      dateTo: historyDateTo || undefined,
      page: 1,
      limit: 50,
    }),
    [historyDateFrom, historyDateTo, historyStatus],
  );
  const earningsParams = useMemo(
    () => ({ dateFrom: earningsDateFrom || undefined, dateTo: earningsDateTo || undefined }),
    [earningsDateFrom, earningsDateTo],
  );

  // Lazy tab data: dashboard + setup status load on entry (profile gating),
  // while each tab's list fires the first time its tab opens (cached after)
  // instead of all 6 endpoints firing together on every dashboard load.
  const ordersQuery = useDeliveryOrders(orderParams, { enabled: activeTab === "active" });
  const historyQuery = useDeliveryHistory(historyParams, { enabled: activeTab === "history" });
  const earningsQuery = useDeliveryEarnings(earningsParams, { enabled: activeTab === "earnings" });
  const payoutsQuery = useDeliveryPayouts({ enabled: activeTab === "earnings" });
  const setupStatusQuery = useDeliverySetupStatus();
  const updateAvailability = useUpdateDeliveryAvailability();
  const payoutMutations = useDeliveryPayoutMutations();
  const updateProfile = useUpdateDeliveryProfile();
  const acceptJob = useAcceptSubOrder();

  const profile = dashboardQuery.data?.profile;
  const orders = ordersQuery.data?.data || [];

  const refreshAll = () => {
    dashboardQuery.refetch();
    ordersQuery.refetch();
    historyQuery.refetch();
    earningsQuery.refetch();
    payoutsQuery.refetch();
  };

  const withBrowserLocation = (
    callback: (location?: { latitude: number; longitude: number; heading?: number }) => void
  ) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      callback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || 0,
        }),
      () => callback(),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleAvailability = () => {
    withBrowserLocation((location) => {
      updateAvailability.mutate({ isOnline: !profile?.isOnline, location });
    });
  };

  const handleAcceptJobOffer = () => {
    if (!activeJobOffer) return;
    acceptJob.mutate(activeJobOffer.subOrderId, {
      onSuccess: () => {
        setActiveJobOffer(null);
        setActiveTab("active");
        refreshAll();
      },
    });
  };

  if (!hasHydrated || !isAuthenticated) {
    return <div className="min-h-screen bg-background" />;
  }

  // Show a friendly "not a delivery partner" UI for authenticated users who
  // landed on this dashboard without the DELIVERY role. Mirrors the seller
  // dashboard's onboarding fallback instead of leaving a blank screen.
  if (!isDeliveryUser) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-muted border border-border p-6 text-center space-y-5 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400">
            <Bike className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Not a Delivery Partner</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your account isn't registered as a delivery partner. Apply to
              start accepting delivery jobs.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              onClick={() => navigate("/delivery/register")}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-5 transition-all"
            >
              Apply as Delivery Partner
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await logoutRequest();
                clearAuth();
                window.location.assign("/delivery/login");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Rider onboarding gate — the seller dashboard has the same pattern. Until
  // admin has approved the rider's application (and a DeliveryBoy profile
  // exists), the dashboard stays locked. This prevents unverified accounts
  // from browsing the live dashboard or hitting the realtime job socket.
  const riderApp = setupStatusQuery.data?.latestRiderApplication;
  const riderProfile = setupStatusQuery.data?.riderProfile;
  const isRiderApproved =
    Boolean(riderProfile) || riderApp?.status === "APPROVED";
  const isRiderPending =
    !setupStatusQuery.isLoading &&
    !isRiderApproved &&
    (riderApp?.status === "PENDING" || Boolean(riderApp));
  const isRiderRejected =
    !setupStatusQuery.isLoading &&
    !isRiderApproved &&
    riderApp?.status === "REJECTED";

  if (setupStatusQuery.isLoading || setupStatusQuery.isFetching) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isRiderApproved) {
    const heading = isRiderRejected
      ? "Application Needs Attention"
      : isRiderPending
        ? "Application Under Review"
        : "Rider Onboarding Required";
    const body =
      (riderApp as any)?.message ||
      (isRiderRejected
        ? riderApp?.rejectionReason ||
          "Your rider application was rejected. Update your details and submit again for admin review."
        : isRiderPending
          ? "Your rider application is waiting for admin approval. You'll be able to accept delivery jobs as soon as it's approved."
          : "You haven't submitted a rider application yet. Complete the onboarding form to start receiving delivery jobs.");

    const Icon = isRiderRejected ? AlertTriangle : Clock;
    const iconColor = isRiderRejected ? "text-amber-400" : "text-cyan-400";
    const iconBg = isRiderRejected ? "bg-amber-400/10" : "bg-cyan-400/10";

    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-muted border border-border p-6 text-center space-y-5 shadow-2xl">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
            <Icon className={`h-8 w-8 ${isRiderPending ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{heading}</h2>
            <p className="text-sm text-muted-foreground mt-2">{body}</p>
            {riderApp && (
              <p className="text-xs text-muted-foreground mt-2">
                Application status: {riderApp.status}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              onClick={() => setupStatusQuery.refetch()}
              disabled={setupStatusQuery.isFetching}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-5 transition-all"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${setupStatusQuery.isFetching ? "animate-spin" : ""}`} />
              Check Approval Status
            </Button>
            {(isRiderRejected || !riderApp) && (
              <Button
                variant="outline"
                onClick={() => navigate("/delivery/register")}
                className="border-border bg-muted text-foreground hover:bg-muted py-5"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isRiderRejected ? "Update Application" : "Start Application"}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={async () => {
                await logoutRequest();
                clearAuth();
                webSocketClient.disconnect();
                window.location.assign("/delivery/login");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="shrink-0 border-b border-border bg-background lg:flex lg:h-screen lg:w-72 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 border-b border-border px-4 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-700 dark:text-cyan-300">
              <Bike className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">QuickBihar</div>
              <div className="truncate text-xs text-muted-foreground">Delivery Panel</div>
            </div>
          </div>

          <nav className="scrollbar-none flex gap-2 overflow-x-auto px-3 py-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
            {deliveryNavigationGroups.map((group) => (
              <div key={group.title} className="flex shrink-0 gap-2 lg:flex-col">
                <div className="hidden px-2 pt-2 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground lg:block">
                  {group.title}
                </div>
                {group.items.map((tab) => (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "h-10 shrink-0 justify-start gap-2 text-muted-foreground hover:bg-muted hover:text-foreground",
                      activeTab === tab.id && "bg-primary text-on-primary hover:bg-primary hover:text-on-primary"
                    )}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </Button>
                ))}
              </div>
            ))}
          </nav>

          <div className="hidden border-t border-border p-4 lg:block space-y-3">
            <div>
              <div className="truncate text-sm font-medium text-foreground">
                {profile?.fullName || user?.fullName || "Delivery Partner"}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Duty Status</span>
                <Badge
                  variant="outline"
                  className={cn("border-border text-muted-foreground", profile?.isOnline && "border-emerald-400/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10")}
                >
                  {profile?.isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>

            {/* Collected COD Cash Liability Indicator */}
            {profile?.wallet?.collectedCodLiability !== undefined && profile.wallet.collectedCodLiability > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1">
                <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  COD Cash Liability
                </div>
                <div className="text-sm font-extrabold text-foreground">
                  Rs. {formatAmount(profile.wallet.collectedCodLiability || 0)}
                </div>
                <div className="text-[9px] text-muted-foreground leading-tight">
                  Hand over collected cash to administrator to settle.
                </div>
              </div>
            )}
          </div>
          <SidebarFooter current="delivery" />
        </aside>

        {/* Workspace panel */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 flex flex-col gap-3 border-b border-border bg-background px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Delivery Dashboard</h1>
              <nav aria-label="Breadcrumb" className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                {activeTab === "overview" ? (
                  <span>{deliverySectionLabels.overview}</span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className="transition-colors hover:text-foreground"
                    >
                      Overview
                    </button>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-foreground">{deliverySectionLabels[activeTab]}</span>
                  </>
                )}
              </nav>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={refreshAll}
                className="border-border bg-muted text-foreground hover:bg-muted"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={toggleAvailability}
                disabled={updateAvailability.isPending || !profile}
                className={cn(profile?.isOnline ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white")}
              >
                <Power className="h-4 w-4 mr-2" />
                {profile?.isOnline ? "Go Offline" : "Go Online"}
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await logoutRequest();
                  clearAuth();
                  webSocketClient.disconnect();
                  navigate("/delivery/login", { replace: true });
                }}
                className="text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </header>

          <ScrollArea className="min-h-0 flex-1 bg-background">
            <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 lg:px-6">
              {activeTab === "overview" && (
                <OverviewPanel dashboard={dashboardQuery.data} loading={dashboardQuery.isLoading} onTab={setActiveTab} />
              )}

              {activeTab === "active" && (
                <ActiveOrdersPanel
                  orders={orders}
                  loading={ordersQuery.isLoading}
                  onSelect={setSelectedOrderId}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  selectedOrderId={selectedOrderId}
                />
              )}

              {activeTab === "history" && (
                <HistoryPanel
                  orders={historyQuery.data?.data || []}
                  loading={historyQuery.isLoading}
                  historyStatus={historyStatus}
                  setHistoryStatus={setHistoryStatus}
                  dateFrom={historyDateFrom}
                  dateTo={historyDateTo}
                  setDateFrom={setHistoryDateFrom}
                  setDateTo={setHistoryDateTo}
                  onSelect={setSelectedOrderId}
                />
              )}

              {activeTab === "earnings" && (
                <EarningsPanel
                  earnings={earningsQuery.data}
                  payouts={payoutsQuery.data}
                  dateFrom={earningsDateFrom}
                  dateTo={earningsDateTo}
                  setDateFrom={setEarningsDateFrom}
                  setDateTo={setEarningsDateTo}
                  loading={earningsQuery.isLoading || payoutsQuery.isLoading}
                  mutations={payoutMutations}
                />
              )}

              {activeTab === "profile" && (
                <ProfilePanel
                  profile={profile}
                  onSubmit={(payload) => updateProfile.mutate(payload)}
                  isPending={updateProfile.isPending}
                />
              )}
            </div>
          </ScrollArea>
        </section>
      </div>

      {/* Real-time Simultaneous Broadcast Job Offer Alert Modal */}
      {activeJobOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in-50 duration-150">
          <div className="w-full max-w-md bg-background border-2 border-cyan-400/40 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Pulsing indicator */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <span className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BellRing className="h-4 w-4 text-cyan-400 animate-bounce" />
                  Broadcast Job Request
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                SO: {activeJobOffer.subOrderId}
              </span>
            </div>

            <div className="p-6 space-y-6 text-foreground">
              <div className="text-center">
                <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Estimated Earnings</div>
                <div className="text-4xl font-extrabold text-cyan-400 mt-1">Rs. {formatAmount(activeJobOffer.payoutAmount)}</div>
              </div>

              <div className="space-y-3.5 bg-muted p-4 rounded-xl border border-border">
                <div className="flex items-start gap-2.5">
                  <PackageOpen className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground">Merchant Store</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{activeJobOffer.storeName}</div>
                    <div className="text-xs text-muted-foreground">{activeJobOffer.storeAddress?.line1}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 border-t border-border pt-3">
                  <MapPin className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground">Delivery Distance</div>
                    <div className="text-xs text-foreground mt-0.5">
                      Store distance: <span className="font-bold text-cyan-400">{activeJobOffer.riderDistanceToStoreKm} KM</span>
                    </div>
                    <div className="text-xs text-foreground">
                      Fulfillment: <span className="font-bold text-cyan-400">{activeJobOffer.distanceKm} KM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Details Badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                {activeJobOffer.packageDetails?.isCod && (
                  <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" /> COD Collection
                  </span>
                )}
                {activeJobOffer.packageDetails?.isFragile && (
                  <span className="px-2.5 py-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg flex items-center gap-1">
                    ⚠️ Fragile
                  </span>
                )}
                <span className="px-2.5 py-1 text-xs font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 rounded-lg">
                  Weight: {activeJobOffer.packageDetails?.weight}g
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-11"
                  onClick={handleAcceptJobOffer}
                  disabled={acceptJob.isPending}
                >
                  {acceptJob.isPending ? "Accepting..." : "Accept Job"}
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 border border-border hover:bg-muted text-muted-foreground hover:text-foreground h-11"
                  onClick={() => setActiveJobOffer(null)}
                  disabled={acceptJob.isPending}
                >
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
