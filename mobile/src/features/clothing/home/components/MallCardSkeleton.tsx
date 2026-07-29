import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import Skeleton from "@/src/components/common/Skeleton";

export const MallCardSkeleton = () => {
  const theme = useTheme() as any;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.border,
          backgroundColor: theme.background,
        },
      ]}
    >
      <Skeleton width="100%" height="100%" borderRadius={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: Platform.OS === 'web' ? 300 : 260,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
  },
});
