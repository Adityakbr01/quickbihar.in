"use client";

import React from "react";
import { Package, WalletCards, Warehouse, Send } from "lucide-react";
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

export function SellerDashboardPanel() {
  const dashboardQuery = useSellerDashboard();
  const dashboard = dashboardQuery.data;
  const setup = dashboard?.setup.setup;
  const wallet = dashboard?.setup.seller.wallet;
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
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Available"
          value={`Rs. ${formatAmount(wallet?.availableBalance || 0)}`}
          icon={<WalletCards className="h-4 w-4" />}
        />
        <Metric
          title="Products"
          value={dashboard?.stats.products.total || 0}
          icon={<Package className="h-4 w-4" />}
        />
        <Metric
          title="Low Stock"
          value={dashboard?.stats.lowStockCount || 0}
          icon={<Warehouse className="h-4 w-4" />}
        />
        <Metric
          title="Pending Reviews"
          value={dashboard?.stats.pendingReviews || 0}
          icon={<Send className="h-4 w-4" />}
        />
      </section>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-4">
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
                order.orderId,
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
                <div
                  key={item._id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">{item.title}</div>
                    <StatusBadge label={item.severity} />
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{item.message}</div>
                </div>
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
