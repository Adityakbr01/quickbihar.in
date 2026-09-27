import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
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
  const stats = dashboard?.stats;
  const recentOrders = dashboard?.recentOrders || [];
  const isOnline = Boolean(profile?.isOnline);

  return (
    <View style={styles.panel}>
      {codLiability > 0 && (
        <View style={styles.codCard}>
          <Text style={styles.codLabel}>Pending COD Liability</Text>
          <Text style={styles.codAmount}>{money(codLiability)}</Text>
          <Text style={styles.codCopy}>Deposit collected cash with admin to clear this balance.</Text>
        </View>
      )}

      <View style={styles.summaryGrid}>
        <SummaryTile styles={styles} label="Active" value={String(stats?.activeOrders ?? activeOrders.length)} />
        <SummaryTile styles={styles} label="Today" value={String(stats?.todayDeliveries || 0)} />
        <SummaryTile styles={styles} label="Available" value={money(stats?.availableBalance ?? wallet?.availableBalance)} />
      </View>
      <View style={styles.summaryGrid}>
        <SummaryTile styles={styles} label="Lifetime" value={money(stats?.lifetimeEarnings ?? wallet?.lifetimeEarnings)} />
        <SummaryTile styles={styles} label="Pending" value={money(stats?.pendingPayoutBalance ?? wallet?.pendingPayoutBalance)} />
        <SummaryTile styles={styles} label="Payouts" value={String(stats?.pendingPayouts || 0)} />
      </View>

      <View style={styles.capacityBar}>
        <View style={styles.flexOne}>
          <Text style={styles.capacityTitle}>Duty Status</Text>
          <Text style={styles.muted}>{isOnline ? "Ready to receive nearby offers." : "Go online to receive delivery offers."}</Text>
        </View>
        <TouchableOpacity style={styles.smallPrimaryButton} onPress={() => onTab("jobs")}>
          <Text style={styles.smallPrimaryText}>Jobs</Text>
        </TouchableOpacity>
      </View>

      <SectionTitle styles={styles} title="Recent Activity" meta={`${recentOrders.length} orders`} />
      {recentOrders.length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon="albums-outline" label="No delivery activity yet." />
      ) : (
        recentOrders.map((order: RiderOrder) => (
          <TouchableOpacity key={order._id} style={styles.listCard} onPress={() => onTab("history")} activeOpacity={0.85}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.cardTitle}>{order.orderId}</Text>
                <Text style={styles.muted}>
                  {cityOf(order)} - {formatDate(order.updatedAt)}
                </Text>
              </View>
              <StatusPill styles={styles} status={order.status} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}
