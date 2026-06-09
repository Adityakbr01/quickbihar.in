"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bike,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  History,
  LogOut,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Power,
  RefreshCcw,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/store/authStore";
import { DeliveryDashboardResponse, DeliveryOrder, DeliveryPayout, DeliveryPayoutMethod, DeliveryPayoutStatus, DeliveryStatus } from "@/features/delivery/api/delivery.api";
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

type DeliveryTab = "overview" | "active" | "history" | "earnings" | "profile";

const activeStatuses: DeliveryStatus[] = ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"];
const terminalStatuses: DeliveryStatus[] = ["DELIVERED", "CANCELLED"];
const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
const selectClass = "h-9 rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";
const textareaClass = "min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500";

const nextActionByStatus: Partial<Record<DeliveryStatus, { action: "ACCEPTED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED"; label: string; icon: ReactNode }>> = {
  ASSIGNED: { action: "ACCEPTED", label: "Accept", icon: <CheckCircle2 className="h-4 w-4" /> },
  ACCEPTED: { action: "PICKED_UP", label: "Picked up", icon: <PackageCheck className="h-4 w-4" /> },
  PICKED_UP: { action: "OUT_FOR_DELIVERY", label: "Out for delivery", icon: <Truck className="h-4 w-4" /> },
  OUT_FOR_DELIVERY: { action: "DELIVERED", label: "Complete", icon: <CheckCircle2 className="h-4 w-4" /> },
};

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
  const earningsParams = useMemo(() => ({ dateFrom: earningsDateFrom || undefined, dateTo: earningsDateTo || undefined }), [earningsDateFrom, earningsDateTo]);

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
  const selectedActiveOrder = activeOrders.find((order) => order._id === selectedOrderId) || null;

  const refreshAll = () => {
    dashboardQuery.refetch();
    ordersQuery.refetch();
    historyQuery.refetch();
    earningsQuery.refetch();
    payoutsQuery.refetch();
  };

  const withBrowserLocation = (callback: (location?: { latitude: number; longitude: number; heading?: number }) => void) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      callback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading || 0,
      }),
      () => callback(),
      { enableHighAccuracy: true, timeout: 8000 },
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
    const next = nextActionByStatus[deliveryStatusOf(order)];
    if (!next) return;
    withBrowserLocation((location) => {
      updateOrderStatus.mutate({
        orderId: order._id,
        action: next.action,
        otp: next.action === "DELIVERED" ? otpByOrder[order._id]?.trim() : undefined,
        location,
      });
    });
  };

  if (!hasHydrated || !isAuthenticated || !isDeliveryUser) return <div className="min-h-screen bg-[#101214]" />;

  return (
    <main className="dark h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
        <DeliverySidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          profileName={profile?.fullName || user?.fullName || "Delivery Partner"}
          isOnline={Boolean(profile?.isOnline)}
        />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 flex flex-col gap-3 border-b border-white/10 bg-[#101214] px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Delivery Panel</h1>
              <p className="text-sm text-gray-400">{deliverySectionLabels[activeTab]}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={refreshAll} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
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
                <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
                  <Card className="border-white/10 bg-[#1c1c1c]">
                    <CardHeader className="flex flex-col gap-3 border-b border-white/10 md:flex-row md:items-center md:justify-between">
                      <CardTitle className="flex items-center gap-2 text-base text-white">
                        <Truck className="h-4 w-4 text-cyan-300" />
                        Active Jobs
                      </CardTitle>
                      <select value={activeStatusFilter} onChange={(event) => setStatusFilter(event.target.value as DeliveryStatus | "ALL")} className={selectClass}>
                        <option value="ALL">All statuses</option>
                        {activeStatuses.map((status) => <option key={status} value={status}>{deliveryStatusLabel(status)}</option>)}
                      </select>
                    </CardHeader>
                    <CardContent className="px-0">
                      <OrdersTable
                        orders={activeOrders}
                        loading={ordersQuery.isLoading}
                        otpByOrder={otpByOrder}
                        onOtp={(orderId, value) => setOtpByOrder((current) => ({ ...current, [orderId]: value }))}
                        onNext={runNextAction}
                        onLocation={updateOrderLocation}
                        onSelect={setSelectedOrderId}
                        isPending={updateOrderStatus.isPending || updateLocation.isPending}
                      />
                    </CardContent>
                  </Card>
                  <OrderDetailPanel order={selectedActiveOrder || activeOrders[0] || null} />
                </section>
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
                <ProfilePanel profile={profile} onSubmit={(payload) => updateProfile.mutate(payload)} isPending={updateProfile.isPending} />
              )}
            </div>
          </ScrollArea>
        </section>
      </div>
    </main>
  );
}

function DeliverySidebar({
  activeTab,
  onTabChange,
  profileName,
  isOnline,
}: {
  activeTab: DeliveryTab;
  onTabChange: (tab: DeliveryTab) => void;
  profileName: string;
  isOnline: boolean;
}) {
  return (
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
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "h-10 shrink-0 justify-start gap-2 text-gray-300 hover:bg-white/10 hover:text-white",
                    activeTab === tab.id && "bg-white text-black hover:bg-white hover:text-black",
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
        <div className="truncate text-sm font-medium text-white">{profileName}</div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
          <span>Status</span>
          <Badge variant="outline" className={cn("border-white/10 text-gray-300", isOnline && "border-emerald-400/30 text-emerald-300")}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>
    </aside>
  );
}

function OverviewPanel({ dashboard, loading, onTab }: { dashboard: ReturnType<typeof useDeliveryDashboard>["data"]; loading: boolean; onTab: (tab: DeliveryTab) => void }) {
  const stats = dashboard?.stats;
  const profile = dashboard?.profile;

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Active" value={loading ? "-" : stats?.activeOrders || 0} icon={<Truck className="h-4 w-4" />} />
        <Metric title="Today Delivered" value={loading ? "-" : stats?.todayDeliveries || 0} icon={<CalendarDays className="h-4 w-4" />} />
        <Metric title="Available" value={`Rs. ${formatAmount(stats?.availableBalance || 0)}`} icon={<WalletCards className="h-4 w-4" />} />
        <Metric title="Lifetime" value={`Rs. ${formatAmount(stats?.lifetimeEarnings || 0)}`} icon={<WalletCards className="h-4 w-4" />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(dashboard?.recentOrders || []).length ? dashboard?.recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium text-white">{order.orderId}</div>
                  <div className="text-xs text-gray-500">{order.shippingAddress?.city || "-"} · {formatDate(order.updatedAt)}</div>
                </div>
                <DeliveryStatusBadge status={deliveryStatusOf(order)} />
              </div>
            )) : <EmptyState label="No delivery activity yet." />}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Bike className="h-4 w-4 text-cyan-300" />
              Rider Status
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <ProfileLine label="Availability" value={profile?.isOnline ? "Online" : "Offline"} />
            <ProfileLine label="Verification" value={profile?.isVerified ? "Verified" : "Pending"} />
            <ProfileLine label="Vehicle" value={[profile?.vehicleType, profile?.vehicleNumber].filter(Boolean).join(" / ") || "-"} />
            <ProfileLine label="Pending Payout" value={`Rs. ${formatAmount(stats?.pendingPayoutBalance || 0)}`} />
            <Button type="button" onClick={() => onTab("earnings")} className="mt-2 bg-cyan-600 hover:bg-cyan-700">
              <WalletCards className="h-4 w-4" />
              View Earnings
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function OrdersTable({
  orders,
  loading,
  otpByOrder,
  onOtp,
  onNext,
  onLocation,
  onSelect,
  isPending,
}: {
  orders: DeliveryOrder[];
  loading: boolean;
  otpByOrder: Record<string, string>;
  onOtp: (orderId: string, value: string) => void;
  onNext: (order: DeliveryOrder) => void;
  onLocation: (order: DeliveryOrder) => void;
  onSelect: (orderId: string) => void;
  isPending: boolean;
}) {
  if (loading) return <div className="px-4 py-10 text-sm text-gray-400">Loading orders...</div>;
  if (!orders.length) return <div className="px-4 py-10 text-sm text-gray-400">No active orders.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="px-4 text-gray-400">Order</TableHead>
          <TableHead className="text-gray-400">Customer</TableHead>
          <TableHead className="text-gray-400">Drop</TableHead>
          <TableHead className="text-gray-400">Status</TableHead>
          <TableHead className="text-right text-gray-400">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <DeliveryOrderRow
            key={order._id}
            order={order}
            otp={otpByOrder[order._id] || ""}
            onOtp={(value) => onOtp(order._id, value)}
            onNext={() => onNext(order)}
            onLocation={() => onLocation(order)}
            onSelect={() => onSelect(order._id)}
            isPending={isPending}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function DeliveryOrderRow({
  order,
  otp,
  onOtp,
  onNext,
  onLocation,
  onSelect,
  isPending,
}: {
  order: DeliveryOrder;
  otp: string;
  onOtp: (value: string) => void;
  onNext: () => void;
  onLocation: () => void;
  onSelect: () => void;
  isPending: boolean;
}) {
  const deliveryStatus = deliveryStatusOf(order);
  const next = nextActionByStatus[deliveryStatus];
  const needsOtp = next?.action === "DELIVERED";

  return (
    <TableRow className="border-white/10 hover:bg-white/[0.03]">
      <TableCell className="px-4">
        <button type="button" onClick={onSelect} className="text-left font-medium text-white hover:text-cyan-300">{order.orderId}</button>
        <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-white">{order.shippingAddress.fullName}</div>
        <div className="text-xs text-gray-500">{order.shippingAddress.phone}</div>
      </TableCell>
      <TableCell>
        <div className="max-w-60 truncate text-sm text-white">{order.shippingAddress.street}</div>
        <div className="text-xs text-gray-500">{order.shippingAddress.city}, {order.shippingAddress.pincode}</div>
      </TableCell>
      <TableCell>
        <DeliveryStatusBadge status={deliveryStatus} />
        <div className="mt-1 text-xs text-gray-500">Rs. {formatAmount(order.delivery?.payoutAmount || order.shippingFee || 0)}</div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap justify-end gap-2">
          {needsOtp && <Input value={otp} onChange={(event) => onOtp(event.target.value)} placeholder="OTP" className={cn(inputClass, "h-9 w-24")} />}
          {next && (
            <Button size="sm" onClick={onNext} disabled={isPending || (needsOtp && otp.trim().length < 4)}>
              {next.icon}
              {next.label}
            </Button>
          )}
          {activeStatuses.includes(deliveryStatus) && (
            <Button size="sm" variant="outline" onClick={onLocation} disabled={isPending} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              <Navigation className="h-3.5 w-3.5" />
              Location
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function OrderDetailPanel({ order }: { order: DeliveryOrder | null }) {
  if (!order) {
    return (
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="py-10"><EmptyState label="Select an order to view details." /></CardContent>
      </Card>
    );
  }

  const mapHref = order.shippingAddress.latitude && order.shippingAddress.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.shippingAddress.street} ${order.shippingAddress.city} ${order.shippingAddress.pincode}`)}`;

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <MapPin className="h-4 w-4 text-cyan-300" />
          Order Detail
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div>
          <div className="font-medium text-white">{order.orderId}</div>
          <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
        </div>
        <ProfileLine label="Customer" value={order.shippingAddress.fullName} />
        <ProfileLine label="Phone" value={order.shippingAddress.phone} />
        <ProfileLine label="Status" value={deliveryStatusLabel(deliveryStatusOf(order))} />
        <ProfileLine label="Payout" value={`Rs. ${formatAmount(order.delivery?.payoutAmount || order.shippingFee || 0)}`} />
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-gray-300">
          {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
        </div>
        <div className="grid gap-2">
          {(order.items || []).map((item) => (
            <div key={`${item.sku}-${item.size}-${item.color}`} className="flex justify-between gap-3 border-b border-white/10 pb-2 last:border-0">
              <span className="text-gray-300">{item.title}</span>
              <span className="text-white">x{item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-white hover:bg-white/10">
            <Navigation className="h-4 w-4" />
            Map
          </a>
          <a href={`tel:${order.shippingAddress.phone}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-white hover:bg-white/10">
            <Phone className="h-4 w-4" />
            Call
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryPanel({
  orders,
  loading,
  historyStatus,
  setHistoryStatus,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  onSelect,
}: {
  orders: DeliveryOrder[];
  loading: boolean;
  historyStatus: DeliveryStatus | "ALL";
  setHistoryStatus: (status: DeliveryStatus | "ALL") => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  onSelect: (orderId: string) => void;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="flex flex-col gap-3 border-b border-white/10 xl:flex-row xl:items-center xl:justify-between">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <History className="h-4 w-4 text-cyan-300" />
          Order History
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value as DeliveryStatus | "ALL")} className={selectClass}>
            <option value="ALL">All statuses</option>
            {[...activeStatuses, ...terminalStatuses].map((status) => <option key={status} value={status}>{deliveryStatusLabel(status)}</option>)}
          </select>
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Date From" className={cn(inputClass, "w-36")} />
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="Date To" className={cn(inputClass, "w-36")} />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {loading && <div className="px-4 py-10 text-sm text-gray-400">Loading history...</div>}
        {!loading && !orders.length && <div className="px-4 py-10 text-sm text-gray-400">No history found.</div>}
        {!loading && Boolean(orders.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Order</TableHead>
                <TableHead className="text-gray-400">Customer</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Payout</TableHead>
                <TableHead className="text-gray-400">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell className="px-4">
                    <button type="button" onClick={() => onSelect(order._id)} className="font-medium text-white hover:text-cyan-300">{order.orderId}</button>
                  </TableCell>
                  <TableCell className="text-gray-300">{order.shippingAddress.fullName}</TableCell>
                  <TableCell><DeliveryStatusBadge status={deliveryStatusOf(order)} /></TableCell>
                  <TableCell className="text-white">Rs. {formatAmount(order.delivery?.payoutAmount || 0)}</TableCell>
                  <TableCell className="text-gray-400">{formatDate(order.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function EarningsPanel({
  earnings,
  payouts,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  loading,
  mutations,
}: {
  earnings: ReturnType<typeof useDeliveryEarnings>["data"];
  payouts: ReturnType<typeof useDeliveryPayouts>["data"];
  dateFrom: string;
  dateTo: string;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  loading: boolean;
  mutations: ReturnType<typeof useDeliveryPayoutMutations>;
}) {
  const verifiedMethods = (payouts?.payoutMethods || []).filter((method) => method.status === "VERIFIED");
  const payoutList = payouts?.payouts || [];
  const filteredPayoutList = payoutList.filter((payout) => dateInRange(payoutTimelineDate(payout), dateFrom, dateTo));
  const pendingPayouts = filteredPayoutList.filter((payout) => payout.status === "PENDING" || payout.status === "PROCESSING");
  const paidPayouts = filteredPayoutList.filter((payout) => payout.status === "PAID");
  const failedPayouts = filteredPayoutList.filter((payout) => payout.status === "FAILED");
  const timeline = buildEarningsTimeline({
    ledger: earnings?.ledger || [],
    payouts: filteredPayoutList,
  });

  const submitMethod = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type") || "UPI") as "BANK" | "UPI";
    if (type === "UPI") {
      mutations.addMethod.mutate({ type, label: optionalText(form, "label"), upi: { upiId: text(form, "upiId") } });
      event.currentTarget.reset();
      return;
    }
    mutations.addMethod.mutate({
      type,
      label: optionalText(form, "label"),
      bank: {
        accountHolderName: text(form, "accountHolderName"),
        accountNumber: text(form, "accountNumber"),
        ifsc: text(form, "ifsc"),
        bankName: text(form, "bankName"),
      },
    });
    event.currentTarget.reset();
  };

  const submitPayout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutations.request.mutate({
      amount: Number(form.get("amount") || 0),
      payoutMethodId: text(form, "payoutMethodId"),
      note: optionalText(form, "note"),
    });
    event.currentTarget.reset();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="grid gap-4">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-white">Date filter</div>
              <div className="mt-1 text-xs text-gray-500">Timeline and ledger show credit/debit entries for the selected date range.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Date From" className={cn(inputClass, "w-36")} />
              <DatePicker value={dateTo} onChange={setDateTo} placeholder="Date To" className={cn(inputClass, "w-36")} />
              <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => {
                const today = todayInputValue();
                setDateFrom(today);
                setDateTo(today);
              }}>
                Today
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <Metric title="Available" value={`Rs. ${formatAmount(payouts?.wallet.availableBalance || earnings?.wallet.availableBalance || 0)}`} icon={<WalletCards className="h-4 w-4" />} />
          <Metric title="Pending" value={`Rs. ${formatAmount(payouts?.wallet.pendingPayoutBalance || earnings?.wallet.pendingPayoutBalance || 0)}`} icon={<WalletCards className="h-4 w-4" />} />
          <Metric title="Credited" value={`Rs. ${formatAmount(earnings?.totalCredited || 0)}`} icon={<CheckCircle2 className="h-4 w-4" />} />
          <Metric title="Paid Requests" value={paidPayouts.length} icon={<CheckCircle2 className="h-4 w-4" />} />
          <Metric title="Pending Requests" value={pendingPayouts.length} icon={<WalletCards className="h-4 w-4" />} />
        </section>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="gap-3 border-b border-white/10 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <WalletCards className="h-4 w-4 text-cyan-300" />
                Earnings Ledger
              </CardTitle>
              <div className="mt-1 text-xs text-gray-500">Order-wise credited rider payouts with delivered and credited times.</div>
            </div>
            <Badge variant="outline" className="border-emerald-400/30 text-emerald-300">Rs. {formatAmount(earnings?.totalCredited || 0)} credited</Badge>
          </CardHeader>
          <CardContent className="px-0">
            {loading && <div className="px-4 py-10 text-sm text-gray-400">Loading earnings...</div>}
            {!loading && !(earnings?.ledger || []).length && <div className="px-4 py-10 text-sm text-gray-400">No credited earnings yet.</div>}
            {!loading && Boolean((earnings?.ledger || []).length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Order</TableHead>
                    <TableHead className="text-gray-400">Customer</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Delivered</TableHead>
                    <TableHead className="text-gray-400">Credited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings?.ledger.map((item) => (
                    <TableRow key={item._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4 font-medium text-white">{item.orderId}</TableCell>
                      <TableCell className="text-gray-300">{item.customerName || "-"}</TableCell>
                      <TableCell className="text-white">Rs. {formatAmount(item.amount)}</TableCell>
                      <TableCell className="text-gray-400">{formatDate(item.deliveredAt)}</TableCell>
                      <TableCell className="text-gray-400">{formatDate(item.creditedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="gap-3 border-b border-white/10 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <History className="h-4 w-4 text-cyan-300" />
                Full Earnings Timeline
              </CardTitle>
              <div className="mt-1 text-xs text-gray-500">Only wallet credits and debits for the selected date range.</div>
            </div>
            <Badge variant="outline" className="border-white/10 text-gray-300">{timeline.length} events</Badge>
          </CardHeader>
          <CardContent>
            {loading && <div className="py-10 text-sm text-gray-400">Loading timeline...</div>}
            {!loading && !timeline.length && <EmptyState label="No credit or debit entries for this date range." />}
            {!loading && Boolean(timeline.length) && (
              <div className="grid gap-3">
                {timeline.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <WalletCards className="h-4 w-4 text-cyan-300" />
              Payout Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading && <div className="px-4 py-10 text-sm text-gray-400">Loading payouts...</div>}
            {!loading && !filteredPayoutList.length && <div className="px-4 py-10 text-sm text-gray-400">No payout requests in this date range.</div>}
            {!loading && Boolean(filteredPayoutList.length) && (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Requested</TableHead>
                    <TableHead className="text-gray-400">Paid/Updated</TableHead>
                    <TableHead className="text-gray-400">By</TableHead>
                    <TableHead className="text-gray-400">Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayoutList.map((payout) => (
                    <TableRow key={payout._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4 text-white">Rs. {formatAmount(payout.amount)}</TableCell>
                      <TableCell><PayoutStatusBadge status={payout.status} /></TableCell>
                      <TableCell className="text-gray-400">{formatDate(payout.createdAt)}</TableCell>
                      <TableCell className="text-gray-400">{formatDate(payout.processedAt || payout.updatedAt)}</TableCell>
                      <TableCell className="text-gray-400">{payoutProcessedBy(payout)}</TableCell>
                      <TableCell className="text-gray-400">{payout.referenceId || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <WalletCards className="h-4 w-4 text-cyan-300" />
              Payout Status
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <ProfileLine label="Pending requests" value={String(pendingPayouts.length)} />
            <ProfileLine label="Paid requests" value={String(paidPayouts.length)} />
            <ProfileLine label="Failed requests" value={String(failedPayouts.length)} />
            <ProfileLine label="Pending amount" value={`Rs. ${formatAmount(pendingPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0))}`} />
            <ProfileLine label="Paid amount" value={`Rs. ${formatAmount(paidPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0))}`} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <CreditCard className="h-4 w-4 text-cyan-300" />
              Payout Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              {(payouts?.payoutMethods || []).length ? payouts?.payoutMethods.map((method) => (
                <PayoutMethodRow key={method._id} method={method} onDefault={() => mutations.setDefault.mutate(method._id)} isPending={mutations.setDefault.isPending} />
              )) : <EmptyState label="No payout methods yet." />}
            </div>
            <form onSubmit={submitMethod} className="grid gap-3">
              <select name="type" className={selectClass}>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank</option>
              </select>
              <Input name="label" placeholder="Label" className={inputClass} />
              <Input name="upiId" placeholder="UPI ID" className={inputClass} />
              <Input name="accountHolderName" placeholder="Account holder" className={inputClass} />
              <Input name="accountNumber" placeholder="Account number" className={inputClass} />
              <Input name="ifsc" placeholder="IFSC" className={inputClass} />
              <Input name="bankName" placeholder="Bank name" className={inputClass} />
              <Button type="submit" disabled={mutations.addMethod.isPending}>
                <CreditCard className="h-4 w-4" />
                Add Method
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <WalletCards className="h-4 w-4 text-cyan-300" />
              Request Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPayout} className="grid gap-3">
              <select name="payoutMethodId" required className={selectClass}>
                <option value="">Verified method</option>
                {verifiedMethods.map((method) => <option key={method._id} value={method._id}>{method.displayName || method.label || method.type}</option>)}
              </select>
              <Input name="amount" type="number" min="1" placeholder="Amount" required className={inputClass} />
              <textarea name="note" placeholder="Note" className={textareaClass} />
              <Button type="submit" disabled={mutations.request.isPending || !verifiedMethods.length}>
                <WalletCards className="h-4 w-4" />
                Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PayoutMethodRow({ method, onDefault, isPending }: { method: DeliveryPayoutMethod; onDefault: () => void; isPending: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{method.displayName || method.label || method.type}</div>
          <div className="text-xs text-gray-500">{payoutMethodName(method)}</div>
        </div>
        <MethodStatusBadge status={method.status} />
      </div>
      <div className="mt-3 grid gap-1 text-xs text-gray-400">
        <div>Submitted: {formatDate(method.createdAt)}</div>
        {method.verifiedAt && <div>Verified: {formatDate(method.verifiedAt)}</div>}
        {method.rejectionReason && <div className="text-red-300">Rejected: {method.rejectionReason}</div>}
      </div>
      {method.status === "VERIFIED" && !method.isDefault && (
        <Button type="button" size="sm" variant="outline" onClick={onDefault} disabled={isPending} className="mt-3 border-white/10 bg-white/5 text-white hover:bg-white/10">
          Set default
        </Button>
      )}
      {method.isDefault && <div className="mt-2 text-xs text-cyan-300">Default method</div>}
    </div>
  );
}

type EarningsLedgerItem = {
  _id: string;
  orderId: string;
  amount: number;
  creditedAt?: string;
  deliveredAt?: string;
  customerName?: string;
  status?: DeliveryStatus;
};

type EarningsTimelineItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  at?: string;
  actor: string;
  location: string;
  amount?: number;
  detail?: string;
  tone: "cyan" | "emerald" | "amber" | "red" | "slate";
};

function TimelineItem({ item }: { item: EarningsTimelineItem }) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_auto]">
      <div className="flex gap-3">
        <div className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", timelineDotClass(item.tone))} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-white">{item.title}</div>
            <TimelineStatusBadge label={item.status} tone={item.tone} />
          </div>
          <div className="mt-1 text-sm text-gray-400">{item.subtitle}</div>
          <div className="mt-2 grid gap-1 text-xs text-gray-500 sm:grid-cols-3">
            <span>When: {formatDate(item.at)}</span>
            <span>Who: {item.actor}</span>
            <span>Where: {item.location}</span>
          </div>
          {item.detail && <div className="mt-2 text-xs text-gray-400">{item.detail}</div>}
        </div>
      </div>
      {typeof item.amount === "number" && (
        <div className="text-right text-sm font-semibold text-white">Rs. {formatAmount(item.amount)}</div>
      )}
    </div>
  );
}

function buildEarningsTimeline({
  ledger,
  payouts,
}: {
  ledger: EarningsLedgerItem[];
  payouts: DeliveryPayout[];
}): EarningsTimelineItem[] {
  const items: EarningsTimelineItem[] = [];

  ledger.forEach((entry) => {
    items.push({
      id: `credit-${entry._id}`,
      title: "Credit to wallet",
      subtitle: `${entry.orderId} · ${entry.customerName || "Customer"}`,
      status: "CREDITED",
      at: entry.creditedAt || entry.deliveredAt,
      actor: "QuickBihar wallet",
      location: "Available balance",
      amount: entry.amount,
      detail: entry.deliveredAt ? `Delivered at ${formatDate(entry.deliveredAt)}` : undefined,
      tone: "emerald",
    });
  });

  payouts.forEach((payout) => {
    const isTerminal = payout.status === "PAID" || payout.status === "FAILED";
    items.push({
      id: `payout-${payout._id}-${payout.status}`,
      title: debitTitle(payout.status),
      subtitle: `${payout.method || "Payout method"} request`,
      status: debitStatusLabel(payout.status),
      at: isTerminal ? payout.processedAt || payout.updatedAt || payout.createdAt : payout.createdAt,
      actor: isTerminal ? payoutProcessedBy(payout) : "You",
      location: payout.status === "PENDING" ? "Admin payout queue" : payout.method || "Payout rail",
      amount: payout.amount,
      detail: [
        payout.createdAt ? `Requested ${formatDate(payout.createdAt)}` : undefined,
        payout.referenceId ? `Reference ${payout.referenceId}` : undefined,
        payout.note,
      ].filter(Boolean).join(" · ") || undefined,
      tone: payoutTone(payout.status),
    });
  });

  return items.sort((first, second) => timeValue(second.at) - timeValue(first.at)).slice(0, 120);
}

function PayoutStatusBadge({ status }: { status: DeliveryPayoutStatus }) {
  return <TimelineStatusBadge label={status} tone={payoutTone(status)} />;
}

function MethodStatusBadge({ status }: { status: DeliveryPayoutMethod["status"] }) {
  const tone = status === "VERIFIED" ? "emerald" : status === "REJECTED" ? "red" : "amber";
  return <TimelineStatusBadge label={status.replace(/_/g, " ")} tone={tone} />;
}

function TimelineStatusBadge({ label, tone }: { label: string; tone: EarningsTimelineItem["tone"] }) {
  return (
    <Badge variant="outline" className={timelineBadgeClass(tone)}>
      {label.replace(/_/g, " ")}
    </Badge>
  );
}

function timelineBadgeClass(tone: EarningsTimelineItem["tone"]) {
  if (tone === "emerald") return "border-emerald-400/30 text-emerald-300";
  if (tone === "amber") return "border-amber-400/30 text-amber-300";
  if (tone === "red") return "border-red-400/30 text-red-300";
  if (tone === "cyan") return "border-cyan-400/30 text-cyan-300";
  return "border-white/10 text-gray-300";
}

function timelineDotClass(tone: EarningsTimelineItem["tone"]) {
  if (tone === "emerald") return "bg-emerald-300";
  if (tone === "amber") return "bg-amber-300";
  if (tone === "red") return "bg-red-300";
  if (tone === "cyan") return "bg-cyan-300";
  return "bg-gray-400";
}

function payoutTone(status: DeliveryPayoutStatus): EarningsTimelineItem["tone"] {
  if (status === "PAID") return "emerald";
  if (status === "FAILED") return "red";
  if (status === "PENDING") return "amber";
  return "cyan";
}

function debitTitle(status: DeliveryPayoutStatus) {
  if (status === "PAID") return "Debit paid";
  if (status === "FAILED") return "Debit failed";
  if (status === "PROCESSING") return "Debit processing";
  return "Debit requested";
}

function debitStatusLabel(status: DeliveryPayoutStatus) {
  if (status === "PAID") return "DEBIT PAID";
  if (status === "FAILED") return "DEBIT FAILED";
  if (status === "PROCESSING") return "DEBIT PROCESSING";
  return "DEBIT PENDING";
}

function payoutMethodName(method: DeliveryPayoutMethod) {
  if (method.type === "UPI") return method.upi?.upiId || method.displayName || method.label || "UPI";
  const account = method.bank?.accountNumber ? `A/C ${method.bank.accountNumber.slice(-4)}` : undefined;
  return [method.bank?.bankName, account].filter(Boolean).join(" · ") || method.displayName || method.label || "Bank";
}

function payoutProcessedBy(payout: DeliveryPayout) {
  if (typeof payout.processedBy === "object" && payout.processedBy) return payout.processedBy.fullName || payout.processedBy.email || "Admin";
  if (typeof payout.processedBy === "string" && payout.processedBy) return "Admin";
  return payout.status === "PAID" || payout.status === "FAILED" ? "Admin" : "You";
}

function timeValue(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function payoutTimelineDate(payout: DeliveryPayout) {
  if (payout.status === "PAID" || payout.status === "FAILED") return payout.processedAt || payout.updatedAt || payout.createdAt;
  return payout.createdAt;
}

function dateInRange(value?: string, dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return true;
  if (!value) return false;
  const current = startOfLocalDay(value);
  if (!current) return false;
  const from = dateFrom ? startOfDateInput(dateFrom) : undefined;
  const to = dateTo ? startOfDateInput(dateTo) : undefined;
  if (from && current < from) return false;
  if (to && current > to) return false;
  return true;
}

function startOfLocalDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function startOfDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day).getTime();
}

function ProfilePanel({ profile, onSubmit, isPending }: { profile?: DeliveryDashboardResponse["profile"]; onSubmit: (payload: Record<string, unknown>) => void; isPending: boolean }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      phone: optionalText(form, "phone"),
      vehicleType: optionalText(form, "vehicleType"),
      vehicleNumber: optionalText(form, "vehicleNumber"),
      licenseNumber: optionalText(form, "licenseNumber"),
      address: {
        address: optionalText(form, "address") || "",
        city: optionalText(form, "city") || "",
        state: optionalText(form, "state") || "",
        pincode: optionalText(form, "pincode") || "",
      },
      bankDetails: {
        accountNumber: optionalText(form, "accountNumber") || "",
        ifsc: optionalText(form, "ifsc") || "",
        bankName: optionalText(form, "bankName") || "",
        pan: optionalText(form, "pan") || "",
        upi: optionalText(form, "upi") || "",
        aadhar: optionalText(form, "aadhar") || "",
      },
    });
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <UserRound className="h-4 w-4 text-cyan-300" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <section className="grid gap-3 md:grid-cols-3">
            <Input name="phone" defaultValue={profile?.phone || ""} placeholder="Phone" className={inputClass} />
            <Input name="vehicleType" defaultValue={profile?.vehicleType || ""} placeholder="Vehicle type" className={inputClass} />
            <Input name="vehicleNumber" defaultValue={profile?.vehicleNumber || ""} placeholder="Vehicle number" className={inputClass} />
            <Input name="licenseNumber" defaultValue={profile?.licenseNumber || ""} placeholder="License number" className={inputClass} />
            <Input name="city" defaultValue={profile?.address?.city || ""} placeholder="City" className={inputClass} />
            <Input name="state" defaultValue={profile?.address?.state || ""} placeholder="State" className={inputClass} />
            <Input name="pincode" defaultValue={profile?.address?.pincode || ""} placeholder="Pincode" className={inputClass} />
            <Input name="upi" defaultValue={profile?.bankDetails?.upi || ""} placeholder="UPI" className={inputClass} />
          </section>
          <textarea name="address" defaultValue={profile?.address?.address || ""} placeholder="Address" className={textareaClass} />
          <section className="grid gap-3 md:grid-cols-4">
            <Input name="accountNumber" defaultValue={profile?.bankDetails?.accountNumber || ""} placeholder="Account number" className={inputClass} />
            <Input name="ifsc" defaultValue={profile?.bankDetails?.ifsc || ""} placeholder="IFSC" className={inputClass} />
            <Input name="bankName" defaultValue={profile?.bankDetails?.bankName || ""} placeholder="Bank name" className={inputClass} />
            <Input name="pan" defaultValue={profile?.bankDetails?.pan || ""} placeholder="PAN" className={inputClass} />
            <Input name="aadhar" defaultValue={profile?.bankDetails?.aadhar || ""} placeholder="Aadhar" className={inputClass} />
          </section>
          <Button type="submit" disabled={isPending} className="w-fit bg-cyan-600 hover:bg-cyan-700">
            <UserRound className="h-4 w-4" />
            Save Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Metric({ title, value, icon }: { title: string; value: number | string; icon: ReactNode }) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-sm text-gray-400">{title}</div>
          <div className="mt-1 text-xl font-semibold text-white">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-cyan-300">{icon}</div>
      </CardContent>
    </Card>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-b-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const className = cn(
    "border-white/10 text-gray-300",
    status === "DELIVERED" && "border-emerald-400/30 text-emerald-300",
    activeStatuses.includes(status) && "border-cyan-400/30 text-cyan-300",
    status === "CANCELLED" && "border-red-400/30 text-red-300",
  );
  return <Badge variant="outline" className={className}>{deliveryStatusLabel(status)}</Badge>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="py-6 text-sm text-gray-400">{label}</div>;
}

function deliveryStatusOf(order: DeliveryOrder): DeliveryStatus {
  return order.delivery?.status || "UNASSIGNED";
}

function deliveryStatusLabel(status: DeliveryStatus) {
  return status.replace(/_/g, " ");
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function todayInputValue() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

function text(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function optionalText(form: FormData, key: string) {
  const value = text(form, key);
  return value || undefined;
}
