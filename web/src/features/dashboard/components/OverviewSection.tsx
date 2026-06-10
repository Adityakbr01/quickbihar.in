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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/features/dashboard/utils";
import { Metric, NetworkTile } from "./cards";
import { StatusBadge } from "./badges";
import type { DashboardStats, Mall, Payout } from "@/features/dashboard/api/adminManagement.api";

export function OverviewSection({
  stats,
  payouts,
  malls,
  topMalls,
}: {
  stats?: DashboardStats;
  payouts: Payout[];
  malls: Mall[];
  topMalls: Mall[];
}) {
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
