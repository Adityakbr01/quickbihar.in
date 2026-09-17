import React from "react";
import { useTheme } from "next-themes";
import { BarChart3, Bell, CircleDollarSign, ClipboardList, Package, WalletCards, Warehouse, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSellerDashboard } from "../hooks/useSellerManagement";
import {
  Metric,
  StatusTile,
  SimpleTable,
  StatusBadge,
  EmptyState,
  LoadingState,
  formatAmount,
} from "./SellerHelpers";
import type { SellerSection, SellerSectionIntent } from "./SellerManagementModules";

type ChartPayloadItem = {
  dataKey?: string;
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string | number;
};

export function SellerDashboardPanel({
  onNavigate,
}: {
  onNavigate?: (section: SellerSection, intent?: SellerSectionIntent) => void;
}) {
  const dashboardQuery = useSellerDashboard();
  const { resolvedTheme } = useTheme();
  const user = useAuthStore((state) => state.user);

  // Recharts draws with raw colors (no CSS classes), so pick grid + tick
  // tones per mode to stay readable on both cream and espresso surfaces.
  const isDark = resolvedTheme === "dark";
  const gridStroke = isDark ? "rgba(255,255,255,0.08)" : "rgba(74,56,35,0.14)";
  const tickFill = isDark ? "#9ca3af" : "#857362";

  const hour = new Date().getHours();
  const daypart = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const firstName = user?.fullName?.split(" ")[0] || "Seller";
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  if (dashboardQuery.isLoading) return <LoadingState label="Loading dashboard..." />;

  const dashboard = dashboardQuery.data;
  const setup = dashboard?.setup?.setup;
  const wallet = dashboard?.setup?.seller?.wallet;
  const dailyRevenue = dashboard?.dailyRevenue || [];
  const productPerformance = dashboard?.productPerformance || [];
  const orderStatusRows = Object.entries(dashboard?.stats?.orders || {}).map(([status, value]) => ({
    status,
    count: (value as any)?.count || 0,
    revenue: (value as any)?.revenue || 0,
  }));
  const grossSales = dailyRevenue.reduce((sum: number, row: any) => sum + Number(row.revenue || 0), 0);
  const sellerNet = dailyRevenue.reduce(
    (sum: number, row: any) => sum + Number(row.sellerNet || Math.max(0, Number(row.revenue || 0) - Number(row.platformCommission || 0))),
    0,
  );
  const platformFees = dailyRevenue.reduce((sum: number, row: any) => sum + Number(row.platformCommission || 0), 0);
  const orderCount = dailyRevenue.reduce((sum: number, row: any) => sum + Number(row.orders || 0), 0);
  const salesTrendRows = dailyRevenue.length
    ? dailyRevenue
    : [{ _id: "No data", revenue: 0, sellerNet: 0, platformCommission: 0, orders: 0 }];
  const topProductRows = productPerformance.length
    ? productPerformance.map((item: any) => ({ ...item, title: item.title || item.sku || "Product" }))
    : [{ _id: "empty", title: "No sales", revenue: 0, quantity: 0 }];
  const orderChartRows = orderStatusRows.length
    ? orderStatusRows
    : [{ status: "No orders", count: 0, revenue: 0 }];
  const checklist: Array<{ label: string; done: boolean; section?: SellerSection }> = setup
    ? [
        { label: "Seller approval", done: setup.sellerApproved },
        { label: "Store created", done: setup.storeExists, section: "store" },
        { label: "Store configured", done: setup.storeConfigured, section: "store" },
        { label: "Store active", done: setup.storeActive, section: "store" },
        { label: "Payout verified", done: setup.hasVerifiedPayoutMethod, section: "payouts" },
        { label: "Products unlocked", done: setup.productsUnlocked, section: "products" },
        { label: "Mall optional", done: setup.mallOptional, section: "mall" },
      ]
    : [];
  const isSetupComplete = checklist.length > 0 && checklist.every((item) => item.done);

  return (
    <div className="grid gap-3 sm:gap-4">
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/15 via-card to-card">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{todayLabel}</p>
            <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground">
              Good {daypart}, {firstName}!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening across your store today.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => onNavigate?.("products")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Package className="h-4 w-4" />
              Add product
            </Button>
            <Button type="button" variant="outline" onClick={() => onNavigate?.("orders")}>
              <ClipboardList className="h-4 w-4" />
              View orders
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Metric
          title="Available"
          value={`Rs. ${formatAmount(wallet?.availableBalance || 0)}`}
          icon={<WalletCards className="h-4 w-4" />}
          onClick={() => onNavigate?.("payouts")}
        />
        <Metric
          title="30D Net"
          value={`Rs. ${formatAmount(sellerNet)}`}
          icon={<CircleDollarSign className="h-4 w-4" />}
          onClick={() => onNavigate?.("payouts")}
        />
        <Metric
          title="30D Gross"
          value={`Rs. ${formatAmount(grossSales)}`}
          icon={<BarChart3 className="h-4 w-4" />}
          onClick={() => onNavigate?.("reports")}
        />
        <Metric
          title="30D Orders"
          value={orderCount}
          icon={<ClipboardList className="h-4 w-4" />}
          onClick={() => onNavigate?.("orders")}
        />
        <Metric
          title="Products"
          value={dashboard?.stats?.products?.total || 0}
          icon={<Package className="h-4 w-4" />}
          onClick={() => onNavigate?.("products")}
        />
        <Metric
          title="Low Stock"
          value={dashboard?.stats?.lowStockCount || 0}
          icon={<Warehouse className="h-4 w-4" />}
          onClick={() => onNavigate?.("inventory", { inventoryStatus: "low" })}
        />
        <Metric
          title="Pending Reviews"
          value={dashboard?.stats?.pendingReviews || 0}
          icon={<Send className="h-4 w-4" />}
          onClick={() => onNavigate?.("products", { productApprovalStatus: "PENDING_REVIEW" })}
        />
        <Metric
          title="Notifications"
          value={dashboard?.stats?.unreadNotifications || 0}
          icon={<Bell className="h-4 w-4" />}
          onClick={() => onNavigate?.("notifications")}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base text-foreground">Sales And Net Earnings</CardTitle>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesTrendRows}
                  margin={{ left: 0, right: 12, top: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="sellerRevenue" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.48} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="sellerNet" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tickFormatter={shortDate}
                    tick={{ fill: tickFill, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `${Number(value) / 1000}k`}
                    tick={{ fill: tickFill, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip content={<SellerMoneyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Gross sales"
                    stroke="#34d399"
                    strokeWidth={2}
                    fill="url(#sellerRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sellerNet"
                    name="Net earnings"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#sellerNet)"
                  />
                  <Area
                    type="monotone"
                    dataKey="platformCommission"
                    name="Platform fees"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <SellerChartLegend label="Gross sales" value={`Rs. ${formatAmount(grossSales)}`} color="#34d399" />
              <SellerChartLegend label="Net earnings" value={`Rs. ${formatAmount(sellerNet)}`} color="#38bdf8" />
              <SellerChartLegend label="Platform fees" value={`Rs. ${formatAmount(platformFees)}`} color="#fbbf24" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base text-foreground">Order Status Mix</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderChartRows}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="status" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis hide />
                    <Tooltip content={<SellerMoneyTooltip />} />
                    <Bar dataKey="count" name="Orders" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base text-foreground">Top Products</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductRows}
                    margin={{ left: 0, right: 4, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="title" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis hide />
                    <Tooltip content={<SellerMoneyTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {!isSetupComplete && checklist.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-foreground">Setup Checklist</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-4 md:grid-cols-2 xl:grid-cols-4">
            {checklist.map((item) => (
              <StatusTile
                key={item.label}
                title={item.label}
                label={item.done ? "Ready" : "Pending"}
                active={item.done}
                onClick={item.section ? () => onNavigate?.(item.section!) : undefined}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-foreground">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <SimpleTable
              empty="No orders yet."
              columns={["Order", "Customer", "Status", "Amount"]}
              rows={(dashboard?.recentOrders || []).map((order: any) => [
                <button
                  key={`${order._id}-order-link`}
                  type="button"
                  onClick={() => onNavigate?.("orders")}
                  className="text-left font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  {order.orderId}
                </button>,
                order.customer?.fullName || "Customer",
                <StatusBadge key={order._id} label={order.status} />,
                `Rs. ${formatAmount(order.sellerSubtotal || 0)}`,
              ])}
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-foreground">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 pt-4">
            {(dashboard?.recentNotifications || []).length ? (
              dashboard?.recentNotifications.map((item: any) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => onNavigate?.("notifications")}
                  className="rounded-lg border border-border bg-muted p-3 text-left transition hover:border-primary/40 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                    <StatusBadge label={item.severity} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.message}</div>
                </button>
              ))
            ) : (
              <EmptyState label="No notifications." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}

function SellerMoneyTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-xl">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="grid gap-1">
        {payload.map((item) => {
          const isCount = ["count", "orders", "quantity"].includes(item.dataKey || "");
          return (
            <div key={item.dataKey || item.name} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                {item.name}
              </span>
              <span className="font-medium text-foreground">
                {isCount ? item.value : `Rs. ${formatAmount(Number(item.value || 0))}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SellerChartLegend({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] uppercase text-muted-foreground">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
