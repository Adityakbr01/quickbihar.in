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
import type { SellerSection, SellerSectionIntent } from "./SellerManagementModules";

export function SellerDashboardPanel({
  onNavigate,
}: {
  onNavigate?: (section: SellerSection, intent?: SellerSectionIntent) => void;
}) {
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
    <div className="grid gap-3 sm:gap-4">
      <section className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Metric
          title="Available"
          value={`Rs. ${formatAmount(wallet?.availableBalance || 0)}`}
          icon={<WalletCards className="h-4 w-4" />}
          onClick={() => onNavigate?.("payouts")}
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
