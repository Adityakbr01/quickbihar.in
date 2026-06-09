"use client";

import { useEffect, useMemo, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bike,
  ClipboardList,
  History,
  LogOut,
  Power,
  RefreshCcw,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/features/auth/store/authStore";
import { DeliveryOrder, DeliveryStatus } from "@/features/delivery/api/delivery.api";
import {
  useDeliveryDashboard,
  useDeliveryEarnings,
  useDeliveryHistory,
  useDeliveryOrders,
  useDeliveryPayoutMutations,
  useDeliveryPayouts,
  useUpdateDeliveryAvailability,
  useUpdateDeliveryLocation,
  useUpdateDeliveryOrderStatus,
  useUpdateDeliveryProfile,
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
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<DeliveryTab>("overview");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "ALL">("ALL");
  const [historyStatus, setHistoryStatus] = useState<DeliveryStatus | "ALL">("ALL");
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [earningsDateFrom, setEarningsDateFrom] = useState(todayInputValue());
  const [earningsDateTo, setEarningsDateTo] = useState(todayInputValue());
  const [otpByOrder, setOtpByOrder] = useState<Record<string, string>>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
  const isDeliveryUser = roleName === "DELIVERY";

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (!persistApi) {
      queueMicrotask(() => setHasHydrated(true));
      return;
    }
    if (persistApi.hasHydrated()) {
      queueMicrotask(() => setHasHydrated(true));
      return;
    }
    return persistApi.onFinishHydration(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !isDeliveryUser) router.replace("/delivery/login");
  }, [hasHydrated, isAuthenticated, isDeliveryUser, router]);

  const dashboardQuery = useDeliveryDashboard();
  const activeStatusFilter = statusFilter !== "ALL" && activeStatuses.includes(statusFilter) ? statusFilter : "ALL";
  const orderParams = useMemo(
    () => ({ status: activeStatusFilter === "ALL" ? undefined : activeStatusFilter, page: 1, limit: 50 }),
    [activeStatusFilter],
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

  const ordersQuery = useDeliveryOrders(orderParams);
  const historyQuery = useDeliveryHistory(historyParams);
  const earningsQuery = useDeliveryEarnings(earningsParams);
  const payoutsQuery = useDeliveryPayouts();
  const updateAvailability = useUpdateDeliveryAvailability();
  const updateOrderStatus = useUpdateDeliveryOrderStatus();
  const updateLocation = useUpdateDeliveryLocation();
  const payoutMutations = useDeliveryPayoutMutations();
  const updateProfile = useUpdateDeliveryProfile();

  const profile = dashboardQuery.data?.profile;
  const orders = ordersQuery.data?.data || [];
  const activeOrders = orders.filter((order) => activeStatuses.includes(deliveryStatusOf(order)));

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

  const updateOrderLocation = (order: DeliveryOrder) => {
    withBrowserLocation((location) => {
      if (!location) return;
      updateLocation.mutate({ orderId: order._id, ...location });
    });
  };

  const runNextAction = (order: DeliveryOrder) => {
    const nextActions: Record<string, "ACCEPTED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED"> = {
      ASSIGNED: "ACCEPTED",
      ACCEPTED: "PICKED_UP",
      PICKED_UP: "OUT_FOR_DELIVERY",
      OUT_FOR_DELIVERY: "DELIVERED",
    };
    const action = nextActions[deliveryStatusOf(order)];
    if (!action) return;
    withBrowserLocation((location) => {
      updateOrderStatus.mutate({
        orderId: order._id,
        action,
        otp: action === "DELIVERED" ? otpByOrder[order._id]?.trim() : undefined,
        location,
      });
    });
  };

  if (!hasHydrated || !isAuthenticated || !isDeliveryUser) return <div className="min-h-screen bg-[#101214]" />;

  return (
    <main className="dark h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-white/10 bg-[#181818] lg:flex lg:h-screen lg:w-72 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
              <Bike className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">QuickBihar</div>
              <div className="truncate text-xs text-gray-500">Delivery Panel</div>
            </div>
          </div>

          <nav className="scrollbar-none flex gap-2 overflow-x-auto px-3 py-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
            {deliveryNavigationGroups.map((group) => (
              <div key={group.title} className="flex shrink-0 gap-2 lg:flex-col">
                <div className="hidden px-2 pt-2 text-[11px] font-semibold uppercase tracking-normal text-gray-500 lg:block">
                  {group.title}
                </div>
                {group.items.map((tab) => (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "h-10 shrink-0 justify-start gap-2 text-gray-300 hover:bg-white/10 hover:text-white",
                      activeTab === tab.id && "bg-white text-black hover:bg-white hover:text-black"
                    )}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </Button>
                ))}
              </div>
            ))}
          </nav>

          <div className="hidden border-t border-white/10 p-4 lg:block">
            <div className="truncate text-sm font-medium text-white">
              {profile?.fullName || user?.fullName || "Delivery Partner"}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
              <span>Status</span>
              <Badge
                variant="outline"
                className={cn("border-white/10 text-gray-300", profile?.isOnline && "border-emerald-400/30 text-emerald-300")}
              >
                {profile?.isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 flex flex-col gap-3 border-b border-white/10 bg-[#101214] px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Delivery Panel</h1>
              <p className="text-sm text-gray-400">{deliverySectionLabels[activeTab]}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={refreshAll}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={toggleAvailability}
                disabled={updateAvailability.isPending || !profile}
                className={cn(profile?.isOnline ? "bg-emerald-600 hover:bg-emerald-700" : "bg-cyan-600 hover:bg-cyan-700")}
              >
                <Power className="h-4 w-4" />
                {profile?.isOnline ? "Online" : "Offline"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  clearAuth();
                  router.replace("/delivery/login");
                }}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </header>

          <ScrollArea className="min-h-0 flex-1 bg-[#101214]">
            <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 lg:px-6">
              {activeTab === "overview" && (
                <OverviewPanel dashboard={dashboardQuery.data} loading={dashboardQuery.isLoading} onTab={setActiveTab} />
              )}

              {activeTab === "active" && (
                <ActiveOrdersPanel
                  orders={orders}
                  loading={ordersQuery.isLoading}
                  otpByOrder={otpByOrder}
                  onOtp={(orderId, value) => setOtpByOrder((current) => ({ ...current, [orderId]: value }))}
                  onNext={runNextAction}
                  onLocation={updateOrderLocation}
                  onSelect={setSelectedOrderId}
                  isPending={updateOrderStatus.isPending || updateLocation.isPending}
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
    </main>
  );
}
