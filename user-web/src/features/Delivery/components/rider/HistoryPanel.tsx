import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import type { RiderOrder, RiderOrderStatus } from "../../api/delivery.api";
import { customerNameOf, cityOf, formatDate, historyStatusFilters, money } from "../../theme/riderTheme";
import type { RiderStyles } from "../../types/rider.types";
import { EmptyCard, ProofImages, SectionTitle, StatusPill } from "./RiderShared";
import { RiderDateField } from "./RiderDateField";

export function HistoryPanel({
  styles,
  theme,
  history,
  historyMeta,
  historyStatus,
  historyDateFrom,
  historyDateTo,
  busy,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onLoadMore,
}: {
  styles: RiderStyles;
  theme: Theme;
  history: RiderOrder[];
  historyMeta: { page: number; totalPages: number; total: number };
  historyStatus: "ALL" | RiderOrderStatus;
  historyDateFrom: string;
  historyDateTo: string;
  busy: boolean;
  onStatusChange: (status: "ALL" | RiderOrderStatus) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onLoadMore: () => void;
}) {
  return (
    <View style={styles.panel}>
      <SectionTitle styles={styles} title="Order History" meta={`${historyMeta.total} records`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
        {historyStatusFilters.map((item) => {
          const selected = historyStatus === item.value;
          return (
            <TouchableOpacity key={item.value} style={[styles.filterChip, selected && styles.filterChipSelected]} onPress={() => onStatusChange(item.value)}>
              <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.inlineInputs}>
        <RiderDateField styles={styles} theme={theme} label="From" value={historyDateFrom} onChange={onDateFromChange} />
        <RiderDateField styles={styles} theme={theme} label="To" value={historyDateTo} onChange={onDateToChange} />
      </View>
      {history.length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon="time-outline" label="No history found for this filter." />
      ) : (
        history.map((order) => (
          <View key={order._id} style={styles.listCard}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.cardTitle}>{order.orderId}</Text>
                <Text style={styles.muted}>
                  {customerNameOf(order)} - {cityOf(order)}
                </Text>
              </View>
              <StatusPill styles={styles} status={order.status} />
            </View>
            <View style={styles.metricsRow}>
              <Text style={styles.metric}>{money(order.delivery?.payoutAmount || 0)} payout</Text>
              <Text style={styles.metric}>{formatDate(order.updatedAt)}</Text>
            </View>
            <ProofImages styles={styles} pickupPhoto={order.delivery?.pickupPhoto} deliveryPhoto={order.delivery?.deliveryPhoto} />
          </View>
        ))
      )}
      {historyMeta.page < historyMeta.totalPages && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore} disabled={busy}>
          <Text style={styles.secondaryText}>Load More</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
