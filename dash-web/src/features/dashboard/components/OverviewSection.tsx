import {
  BarChart3,
  Building2,
  CircleDollarSign,
  ClipboardList,
  Image as ImageIcon,
  Package,
  ShieldCheck,
  Store,
  TicketPercent,
  Truck,
  UserPlus,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Children, type ReactNode } from "react";
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
import type { AdminSection } from "./types";
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
  onNavigate,
}: {
  stats?: DashboardStats;
  dailyRevenue: DailyRevenueRow[];
  ordersByStatus: OrderStatusRow[];
  payouts: Payout[];
  malls: Mall[];
  topMalls: Mall[];
  /** Deep-link a metric card to its dashboard section. */
  onNavigate?: (section: AdminSection) => void;
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

  // Recharts draws with raw colors (no CSS classes), so pick grid, tick,
  // and empty-state tones per mode to stay readable on cream and espresso.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridStroke = isDark ? "rgba(255,255,255,0.08)" : "rgba(74,56,35,0.14)";
  const tickFill = isDark ? "#9ca3af" : "#857362";
  const emptyFill = isDark ? "#374151" : "#d8c8ab";

  const go = (section: AdminSection) => (onNavigate ? () => onNavigate(section) : undefined);

  return (
    <div className="grid gap-4">
      {onNavigate && <QuickActions onNavigate={onNavigate} />}
      <MetricGroup title="Needs attention" hint="Waiting for an action">
        <Metric
          title="Pending Partners"
          value={stats?.pendingPartners || 0}
          icon={<ShieldCheck className="h-4 w-4" />}
          onNavigate={go("seller-submissions")}
        />
        <Metric
          title="Mall Requests"
          value={stats?.pendingMallRequests || 0}
          icon={<Building2 className="h-4 w-4" />}
          onNavigate={go("seller-mall")}
        />
        <Metric
          title="Pending Payouts"
          value={stats?.pendingPayouts || 0}
          icon={<CircleDollarSign className="h-4 w-4" />}
          onNavigate={go("payouts")}
        />
        <Metric
          title="Pending Reviews"
          value={stats?.pendingReviews || 0}
          icon={<ShieldCheck className="h-4 w-4" />}
          onNavigate={go("seller-submissions")}
        />
        <Metric
          title="Low Stock"
          value={stats?.lowStockProducts || 0}
          icon={<Package className="h-4 w-4" />}
          onNavigate={go("inventory-logistics")}
        />
      </MetricGroup>

      <MetricGroup title="Network" hint="People and places on QuickBihar">
        <Metric
          title="Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-4 w-4" />}
          onNavigate={go("people")}
        />
        <Metric
          title="Sellers"
          value={stats?.sellers || 0}
          icon={<Store className="h-4 w-4" />}
          onNavigate={go("seller-directory")}
        />
        <Metric
          title="Delivery"
          value={stats?.deliveryBoys || 0}
          icon={<Truck className="h-4 w-4" />}
          onNavigate={go("rider-directory")}
        />
        <Metric
          title="Malls"
          value={stats?.malls || malls.length}
          icon={<Building2 className="h-4 w-4" />}
          onNavigate={go("seller-mall")}
        />
      </MetricGroup>

      <MetricGroup title="Money" hint="Orders and platform earnings">
        <Metric
          title="Orders"
          value={stats?.totalOrders || 0}
          icon={<ClipboardList className="h-4 w-4" />}
          onNavigate={go("orders")}
        />
        <Metric
          title="Revenue"
          value={`Rs. ${formatAmount(stats?.revenue || 0)}`}
          icon={<BarChart3 className="h-4 w-4" />}
          onNavigate={go("reports-analytics")}
        />
        <Metric
          title="Platform Earned"
          value={`Rs. ${formatAmount(stats?.platformEarnings || 0)}`}
          icon={<CircleDollarSign className="h-4 w-4" />}
          onNavigate={go("payouts")}
        />
        <Metric
          title="Net After Rider"
          value={`Rs. ${formatAmount(stats?.platformNetEarnings || 0)}`}
          icon={<WalletCards className="h-4 w-4" />}
          onNavigate={go("reports-analytics")}
        />
        <Metric
          title="Paid"
          value={`Rs. ${formatAmount(stats?.totalPaid || 0)}`}
          icon={<WalletCards className="h-4 w-4" />}
          onNavigate={go("payouts")}
        />
      </MetricGroup>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base text-foreground">Revenue And Platform Earnings</CardTitle>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
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
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base text-foreground">Order Status Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeStatusRows} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="_id"
                      tick={{ fill: tickFill, fontSize: 10 }}
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

          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base text-foreground">Platform Money Mix</CardTitle>
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
                          fill={platformMix.length ? chartColors[index % chartColors.length] : emptyFill}
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
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-foreground">Mall Network</CardTitle>
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

        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-foreground">
              Recent Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payouts.length ? (
              payouts.map((payout) => (
                <div
                  key={payout._id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {payout.partnerId?.fullName || "Partner"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {payout.partnerType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
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
              <div className="py-6 text-sm text-muted-foreground">
                No payouts recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/**
 * One-tap micro shortcuts to the actions admins reach for most —
 * no sidebar hunting.
 */
function QuickActions({ onNavigate }: { onNavigate: (section: AdminSection) => void }) {
  const actions: Array<{ label: string; icon: ReactNode; section: AdminSection }> = [
    { label: "Add Product", icon: <Package className="h-3.5 w-3.5" />, section: "products" },
    { label: "Create Coupon", icon: <TicketPercent className="h-3.5 w-3.5" />, section: "coupons" },
    { label: "New Banner", icon: <ImageIcon className="h-3.5 w-3.5" />, section: "banners" },
    { label: "Review Queue", icon: <ShieldCheck className="h-3.5 w-3.5" />, section: "seller-submissions" },
    { label: "Invite Admin", icon: <UserPlus className="h-3.5 w-3.5" />, section: "invites" },
  ];
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Zap className="h-3.5 w-3.5 text-primary" />
        Quick actions
      </span>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => onNavigate(action.section)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-xs transition hover:border-primary/40 hover:text-primary"
        >
          <span className="text-primary">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

function MetricGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  // Five-card groups (attention, money) span five columns on xl so every
  // card fits on one line; smaller groups keep four.
  const wide = Children.count(children) > 4;
  return (
    <section aria-label={title}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1 px-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div
        className={
          wide
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-5"
            : "grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4"
        }
      >
        {children}
      </div>
    </section>
  );
}

function MoneyTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-xl">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="grid gap-1">
        {payload.map((item) => (
          <div key={item.dataKey || item.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              {item.name}
            </span>
            <span className="font-medium text-foreground">
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
    <div className="rounded-lg border border-border bg-muted px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] uppercase text-muted-foreground">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
