"use client";

import {
  BarChart3,
  Building2,
  CircleDollarSign,
  ClipboardList,
  Package,
  ShieldCheck,
  Store,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/features/dashboard/utils";
import { Metric, NetworkTile } from "./cards";
import { StatusBadge } from "./badges";
import type { DashboardStats, Mall, Payout } from "@/features/dashboard/api/adminManagement.api";

type DailyRevenueRow = {
  _id: string;
  orders: number;
  revenue: number;
  platformEarnings: number;
  platformNetEarnings: number;
};

type OrderStatusRow = {
  _id: string;
  count: number;
  revenue: number;
  platformEarnings: number;
};

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

const chartColors = ["#34d399", "#38bdf8", "#fbbf24", "#a78bfa", "#fb7185"];

const shortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
};

const compactMoney = (value?: number) =>
  `Rs. ${formatAmount(Number(value || 0))}`;

export function OverviewSection({
  stats,
  dailyRevenue,
  ordersByStatus,
  payouts,
  malls,
  topMalls,
}: {
  stats?: DashboardStats;
  dailyRevenue: DailyRevenueRow[];
  ordersByStatus: OrderStatusRow[];
  payouts: Payout[];
  malls: Mall[];
  topMalls: Mall[];
}) {
  const platformMix = [
    { name: "Commission", value: Number(stats?.platformCommission || 0) },
    { name: "Delivery fees", value: Number(stats?.deliveryRevenue || 0) },
  ].filter((item) => item.value > 0);
  const safeDailyRevenue = dailyRevenue.length
    ? dailyRevenue
    : [{ _id: "No data", orders: 0, revenue: 0, platformEarnings: 0, platformNetEarnings: 0 }];
  const safeStatusRows = ordersByStatus.length
    ? ordersByStatus.slice(0, 8)
    : [{ _id: "No orders", count: 0, revenue: 0, platformEarnings: 0 }];

  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric
          title="Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-4 w-4" />}
        />
        <Metric
          title="Sellers"
          value={stats?.sellers || 0}
          icon={<Store className="h-4 w-4" />}
        />
        <Metric
          title="Malls"
          value={stats?.malls || malls.length}
          icon={<Building2 className="h-4 w-4" />}
        />
        <Metric
          title="Delivery"
          value={stats?.deliveryBoys || 0}
          icon={<Truck className="h-4 w-4" />}
        />
        <Metric
          title="Pending Partners"
          value={stats?.pendingPartners || 0}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <Metric
          title="Mall Requests"
          value={stats?.pendingMallRequests || 0}
          icon={<Building2 className="h-4 w-4" />}
        />
        <Metric
          title="Pending Payouts"
          value={stats?.pendingPayouts || 0}
          icon={<CircleDollarSign className="h-4 w-4" />}
        />
        <Metric
          title="Paid"
          value={`Rs. ${formatAmount(stats?.totalPaid || 0)}`}
          icon={<WalletCards className="h-4 w-4" />}
        />
        <Metric
          title="Orders"
          value={stats?.totalOrders || 0}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <Metric
          title="Revenue"
          value={`Rs. ${formatAmount(stats?.revenue || 0)}`}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <Metric
          title="Platform Earned"
          value={`Rs. ${formatAmount(stats?.platformEarnings || 0)}`}
          icon={<CircleDollarSign className="h-4 w-4" />}
        />
        <Metric
          title="Net After Rider"
          value={`Rs. ${formatAmount(stats?.platformNetEarnings || 0)}`}
          icon={<WalletCards className="h-4 w-4" />}
        />
        <Metric
          title="Pending Reviews"
          value={stats?.pendingReviews || 0}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <Metric
          title="Low Stock"
          value={stats?.lowStockProducts || 0}
          icon={<Package className="h-4 w-4" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base text-white">Revenue And Platform Earnings</CardTitle>
              <div className="text-xs text-gray-500">Last 30 days</div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeDailyRevenue} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRevenue" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="adminPlatform" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
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
                  <Tooltip content={<MoneyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Gross revenue"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#adminRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="platformEarnings"
                    name="Platform earned"
                    stroke="#34d399"
                    strokeWidth={2}
                    fill="url(#adminPlatform)"
                  />
                  <Area
                    type="monotone"
                    dataKey="platformNetEarnings"
                    name="Net after rider"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <ChartLegend label="Gross revenue" value={compactMoney(stats?.revenue)} color="#38bdf8" />
              <ChartLegend label="Platform earned" value={compactMoney(stats?.platformEarnings)} color="#34d399" />
              <ChartLegend label="Net after rider" value={compactMoney(stats?.platformNetEarnings)} color="#fbbf24" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-white/10 bg-[#1c1c1c]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-base text-white">Order Status Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeStatusRows} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="_id"
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis hide />
                    <Tooltip content={<MoneyTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill="#38bdf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#1c1c1c]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-base text-white">Platform Money Mix</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 sm:grid-cols-[140px_1fr]">
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformMix.length ? platformMix : [{ name: "No data", value: 1 }]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={38}
                      outerRadius={62}
                      paddingAngle={4}
                    >
                      {(platformMix.length ? platformMix : [{ name: "No data", value: 1 }]).map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={platformMix.length ? chartColors[index % chartColors.length] : "#374151"}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<MoneyTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid content-center gap-2">
                <ChartLegend label="Commission" value={compactMoney(stats?.platformCommission)} color="#34d399" />
                <ChartLegend label="Delivery charges" value={compactMoney(stats?.deliveryRevenue)} color="#38bdf8" />
                <ChartLegend label="Rider estimate" value={compactMoney(stats?.riderPayoutEstimate)} color="#fbbf24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Mall Network</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <NetworkTile
              title="Active Malls"
              value={
                stats?.activeMalls ||
                malls.filter((mall) => mall.isActive).length
              }
            />
            <NetworkTile
              title="Total Malls"
              value={stats?.malls || malls.length}
            />
            <NetworkTile
              title="Seller Links"
              value={stats?.mallLinkedSellers || 0}
            />
            <NetworkTile title="Shown In App" value={topMalls.length} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">
              Recent Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payouts.length ? (
              payouts.map((payout) => (
                <div
                  key={payout._id}
                  className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="text-sm font-medium text-white">
                      {payout.partnerId?.fullName || "Partner"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {payout.partnerType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      Rs. {formatAmount(payout.amount)}
                    </div>
                    <StatusBadge
                      active={payout.status === "PAID"}
                      label={payout.status}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-sm text-gray-400">
                No payouts recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MoneyTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 shadow-xl">
      <div className="mb-1 text-xs font-medium text-gray-400">{label}</div>
      <div className="grid gap-1">
        {payload.map((item) => (
          <div key={item.dataKey || item.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-gray-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              {item.name}
            </span>
            <span className="font-medium text-white">
              {typeof item.value === "number" && item.dataKey !== "count"
                ? compactMoney(item.value)
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartLegend({
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
