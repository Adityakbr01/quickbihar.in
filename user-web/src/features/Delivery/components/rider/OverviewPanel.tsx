import { Layers } from "lucide-react";
import React from "react";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import type { RiderDashboardResponse, RiderOrder, RiderProfile, RiderWallet } from "../../api/delivery.api";
import { cityOf, formatDate, money } from "../../theme/riderTheme";
import type { RiderStyles, RiderTab } from "../../types/rider.types";
import { EmptyCard, SectionTitle, StatusPill, SummaryTile } from "./RiderShared";

export function OverviewPanel({
  styles,
  theme,
  dashboard,
  profile,
  wallet,
  codLiability,
  activeOrders,
  onTab,
}: {
  styles: RiderStyles;
  theme: Theme;
  dashboard: RiderDashboardResponse | null;
  profile: RiderProfile | null;
  wallet?: RiderWallet;
  codLiability: number;
  activeOrders: any[];
  onTab: (tab: RiderTab) => void;
}) {
  void styles;
  const stats = dashboard?.stats;
  const recentOrders = dashboard?.recentOrders || [];
  const isOnline = Boolean(profile?.isOnline);

  return (
    <div className="flex flex-col gap-3.5">
      {codLiability > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: `${theme.warning}16`, borderColor: `${theme.warning}55` }}
        >
          <span className="text-xs font-bold" style={{ color: theme.warning }}>
            Pending COD Liability
          </span>
          <span className="mt-1 block text-2xl font-black" style={{ color: theme.text }}>
            {money(codLiability)}
          </span>
          <span className="mt-1 block text-xs leading-[17px]" style={{ color: theme.secondaryText }}>
            Deposit collected cash with admin to clear this balance.
          </span>
        </div>
      )}

      <div className="flex flex-row gap-2.5">
        <SummaryTile styles={styles} label="Active" value={String(stats?.activeOrders ?? activeOrders.length)} />
        <SummaryTile styles={styles} label="Today" value={String(stats?.todayDeliveries || 0)} />
        <SummaryTile styles={styles} label="Available" value={money(stats?.availableBalance ?? wallet?.availableBalance)} />
      </div>
      <div className="flex flex-row gap-2.5">
        <SummaryTile styles={styles} label="Lifetime" value={money(stats?.lifetimeEarnings ?? wallet?.lifetimeEarnings)} />
        <SummaryTile styles={styles} label="Pending" value={money(stats?.pendingPayoutBalance ?? wallet?.pendingPayoutBalance)} />
        <SummaryTile styles={styles} label="Payouts" value={String(stats?.pendingPayouts || 0)} />
      </div>

      <div
        className="flex flex-row items-center justify-between gap-2.5 rounded-[14px] border p-3"
        style={{ backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}35` }}
      >
        <div className="min-w-0 flex-1">
          <span className="mb-0.5 block text-[13px] font-extrabold" style={{ color: theme.text }}>
            Duty Status
          </span>
          <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
            {isOnline ? "Ready to receive nearby offers." : "Go online to receive delivery offers."}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onTab("jobs")}
          className="cursor-pointer rounded-xl px-3 py-2"
          style={{ backgroundColor: theme.primary }}
        >
          <span className="text-xs font-black text-white">Jobs</span>
        </button>
      </div>

      <SectionTitle styles={styles} title="Recent Activity" meta={`${recentOrders.length} orders`} />
      {recentOrders.length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon={Layers} label="No delivery activity yet." />
      ) : (
        recentOrders.map((order: RiderOrder) => (
          <button
            key={order._id}
            type="button"
            onClick={() => onTab("history")}
            className="w-full cursor-pointer rounded-2xl border p-3.5 text-left"
            style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
          >
            <span className="flex flex-row items-center justify-between gap-2.5">
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold" style={{ color: theme.text }}>
                  {order.orderId}
                </span>
                <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                  {cityOf(order)} - {formatDate(order.updatedAt)}
                </span>
              </span>
              <StatusPill styles={styles} status={order.status} />
            </span>
          </button>
        ))
      )}
    </div>
  );
}
