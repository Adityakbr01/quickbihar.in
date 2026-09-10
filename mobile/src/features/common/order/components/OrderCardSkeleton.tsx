import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import Skeleton from "@/src/components/common/Skeleton";

// Pulsing placeholder that mirrors the order card layout (header row,
// items strip, footer row) so loading feels instant instead of a spinner.
export const OrderCardSkeleton = () => {
  const theme = useTheme() as any;

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.tertiaryBackground },
      ]}
    >
      {/* Header: order id + date | status badge */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Skeleton width="55%" height={16} borderRadius={4} />
          <Skeleton width="35%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={76} height={26} borderRadius={8} />
      </View>

      {/* Items preview strip */}
      <View
        style={[
          styles.preview,
          { backgroundColor: theme.background, borderColor: theme.border },
        ]}
      >
        <Skeleton width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1 }}>
          <Skeleton width="80%" height={13} borderRadius={4} />
        </View>
        <Skeleton width={36} height={36} borderRadius={18} />
      </View>

      {/* Footer: total | details button */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View>
          <Skeleton width={70} height={11} borderRadius={4} />
          <Skeleton width={90} height={18} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={92} height={36} borderRadius={18} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
