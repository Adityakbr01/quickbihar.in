import { StyleSheet } from "react-native";
import { spacing } from "@/src/theme/spacing";

export const createTopSellingSectionStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginTop: 24,
      paddingVertical: 20,
      backgroundColor: theme.secondaryBackground,
      borderTopRightRadius: 32,
      borderTopLeftRadius: 32,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.5,
    },
    seeAllBtn: {
      padding: 4,
    },
    seeAll: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.iconColor,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      gap: 16,
      paddingBottom: 8, // Room for shadow lift
    },
  });
