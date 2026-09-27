import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import Skeleton from "@/src/components/common/Skeleton";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

// Pulsing placeholder mirroring the 2-column wishlist card
// (image block + brand / title / price lines).
export const WishlistCardSkeleton = () => {
  const theme = useTheme() as any;

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.background },
      ]}
    >
      <Skeleton width="100%" height={COLUMN_WIDTH * 1.3} borderRadius={12} />
      <View style={styles.info}>
        <Skeleton width="45%" height={11} borderRadius={4} />
        <Skeleton width="100%" height={13} borderRadius={4} style={{ marginTop: 6 }} />
        <View style={styles.priceRow}>
          <Skeleton width={70} height={16} borderRadius={4} />
          <Skeleton width={45} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: COLUMN_WIDTH,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  info: {
    padding: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
});
