import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import Skeleton from "@/src/components/common/Skeleton";

// Pulsing placeholder mirroring the address card layout
// (type badge row, name / phone / address lines, actions row).
export const AddressCardSkeleton = () => {
  const theme = useTheme() as any;

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.tertiaryBackground },
      ]}
    >
      <View style={styles.header}>
        <Skeleton width={84} height={24} borderRadius={8} />
        <Skeleton width={70} height={22} borderRadius={6} />
      </View>

      <Skeleton width="55%" height={18} borderRadius={4} />
      <Skeleton width="40%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      <Skeleton width="100%" height={14} borderRadius={4} style={{ marginTop: 12 }} />
      <Skeleton width="75%" height={14} borderRadius={4} style={{ marginTop: 6 }} />

      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <Skeleton width={110} height={36} borderRadius={10} />
        <Skeleton width={110} height={36} borderRadius={10} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 14,
    gap: 12,
  },
});
