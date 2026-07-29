import { StyleSheet } from "react-native";
import { spacing } from "@/src/theme/spacing";

export const createMoreDealsSectionStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginTop: 32,
      paddingBottom: 24,
    },
    headerText: {
      fontSize: 22,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 20,
      letterSpacing: -0.5,
    },
    campaignList: {
      paddingHorizontal: spacing.lg,
      gap: 20,
    },
    campaignCard: {
      width: 76,
      alignItems: "center",
      gap: 8,
    },
    campaignImage: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: theme.secondaryBackground || "#f0f0f0",
    },
    campaignTitle: {
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 16,
    },
    filterWrapper: {
      marginBottom: 24,
    },
    filterList: {
      paddingHorizontal: spacing.lg,
      gap: 10,
    },
    filterPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      gap: 6,
    },
    filterText: {
      fontSize: 13,
      fontWeight: "600",
    },
    productGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: spacing.md,
      justifyContent: "space-between",
      gap: spacing.sm,
      rowGap: spacing.lg,
    },
  });
