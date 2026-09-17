import { Bike, ClipboardList, Truck, WalletCards, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryDashboardResponse } from "@/features/delivery/api/delivery.api";
import {
  Metric,
  ProfileLine,
  DeliveryStatusBadge,
  EmptyState,
  deliveryStatusOf,
  formatDate,
  formatAmount,
} from "./DeliveryHelpers";

type DeliveryTab = "overview" | "active" | "history" | "earnings" | "profile";

export function OverviewPanel({
  dashboard,
  loading,
  onTab,
}: {
  dashboard: DeliveryDashboardResponse | undefined;
  loading: boolean;
  onTab: (tab: DeliveryTab) => void;
}) {
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
            {(dashboard?.recentOrders || []).length ? (
              dashboard?.recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium text-white">{order.orderId}</div>
                    <div className="text-xs text-gray-500">
                      {order.shippingAddress?.city || "-"} · {formatDate(order.updatedAt)}
                    </div>
                  </div>
                  <DeliveryStatusBadge status={deliveryStatusOf(order)} />
                </div>
              ))
            ) : (
              <EmptyState label="No delivery activity yet." />
            )}
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
