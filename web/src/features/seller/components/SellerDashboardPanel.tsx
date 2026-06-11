"use client";

import React from "react";
import { BarChart3, Bell, CircleDollarSign, ClipboardList, Package, WalletCards, Warehouse, Send } from "lucide-react";
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
  const dashboard = dashboardQuery.data;
  const setup = dashboard?.setup.setup;
  const wallet = dashboard?.setup.seller.wallet;
  const dailyRevenue = dashboard?.dailyRevenue || [];
  const productPerformance = dashboard?.productPerformance || [];
  const orderStatusRows = Object.entries(dashboard?.stats.orders || {}).map(([status, value]) => ({
    status,
    count: value.count,
    revenue: value.revenue,
  }));
  const grossSales = dailyRevenue.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
  const sellerNet = dailyRevenue.reduce(
    (sum, row) => sum + Number(row.sellerNet || Math.max(0, Number(row.revenue || 0) - Number(row.platformCommission || 0))),
    0,
  );
  const platformFees = dailyRevenue.reduce((sum, row) => sum + Number(row.platformCommission || 0), 0);
  const orderCount = dailyRevenue.reduce((sum, row) => sum + Number(row.orders || 0), 0);
  const salesTrendRows = dailyRevenue.length
    ? dailyRevenue
    : [{ _id: "No data", revenue: 0, sellerNet: 0, platformCommission: 0, orders: 0 }];
  const topProductRows = productPerformance.length
    ? productPerformance.map((item) => ({ ...item, title: item.title || item.sku || "Product" }))
    : [{ _id: "empty", title: "No sales", revenue: 0, quantity: 0 }];
  const orderChartRows = orderStatusRows.length
    ? orderStatusRows
    : [{ status: "No orders", count: 0, revenue: 0 }];
  const checklist = setup
    ? [
        { label: "Seller approval", done: setup.sellerApproved },
        { label: "Store created", done: setup.storeExists },
        { label: "Store configured", done: setup.storeConfigured },
        { label: "Store active", done: setup.storeActive },
        { label: "Payout verified", done: setup.hasVerifiedPayoutMethod },
        { label: "Products unlocked", done: setup.productsUnlocked },
        { label: "Mall optional", done: setup.mallOptional },
      ]
    : [];

  if (dashboardQuery.isLoading) return <LoadingState label="Loading dashboard..." />;

  return (
    <div className="grid gap-3 sm:gap-4">
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
          value={dashboard?.stats.products.total || 0}
          icon={<Package className="h-4 w-4" />}
          onClick={() => onNavigate?.("products")}
        />
        <Metric
          title="Low Stock"
          value={dashboard?.stats.lowStockCount || 0}
          icon={<Warehouse className="h-4 w-4" />}
          onClick={() => onNavigate?.("inventory", { inventoryStatus: "low" })}
        />
        <Metric
          title="Pending Reviews"
          value={dashboard?.stats.pendingReviews || 0}
          icon={<Send className="h-4 w-4" />}
          onClick={() => onNavigate?.("products", { productApprovalStatus: "PENDING_REVIEW" })}
        />
        <Metric
          title="Notifications"
          value={dashboard?.stats.unreadNotifications || 0}
          icon={<Bell className="h-4 w-4" />}
          onClick={() => onNavigate?.("notifications")}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base text-white">Sales And Net Earnings</CardTitle>
              <div className="text-xs text-gray-500">Last 30 days</div>
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
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tickFormatter={shortDate}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `${Number(value) / 1000}k`}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
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
          <Card className="border-white/10 bg-[#1c1c1c]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-base text-white">Order Status Mix</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderChartRows}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="status" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis hide />
                    <Tooltip content={<SellerMoneyTooltip />} />
                    <Bar dataKey="count" name="Orders" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#1c1c1c]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-base text-white">Top Products</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductRows}
                    margin={{ left: 0, right: 4, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="title" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
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

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-4 md:grid-cols-2 xl:grid-cols-4">
          {checklist.map((item) => (
            <StatusTile
              key={item.label}
              title={item.label}
              label={item.done ? "Ready" : "Pending"}
              active={item.done}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <SimpleTable
              empty="No orders yet."
              columns={["Order", "Customer", "Status", "Amount"]}
              rows={(dashboard?.recentOrders || []).map((order) => [
                <button
                  key={`${order._id}-order-link`}
                  type="button"
                  onClick={() => onNavigate?.("orders")}
                  className="text-left font-medium text-white underline-offset-4 hover:text-emerald-200 hover:underline"
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

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 pt-4">
            {(dashboard?.recentNotifications || []).length ? (
              dashboard?.recentNotifications.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => onNavigate?.("notifications")}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-emerald-400/30 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="text-sm font-medium text-white">{item.title}</div>
                    <StatusBadge label={item.severity} />
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{item.message}</div>
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
    <div className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 shadow-xl">
      <div className="mb-1 text-xs font-medium text-gray-400">{label}</div>
      <div className="grid gap-1">
        {payload.map((item) => {
          const isCount = ["count", "orders", "quantity"].includes(item.dataKey || "");
          return (
            <div key={item.dataKey || item.name} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-2 text-gray-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                {item.name}
              </span>
              <span className="font-medium text-white">
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
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] uppercase text-gray-500">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
