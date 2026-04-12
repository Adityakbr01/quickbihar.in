import { StyleSheet, Platform } from "react-native";
import { spacing } from "@/src/theme/spacing";

export const createTopMallSectionStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginTop: 24,
      paddingVertical: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 22,
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
      paddingBottom: 16, // Room for shadow
    },
    // Mall Card Specific Styles
    cardContainer: {
      width: Platform.OS === 'web' ? 300 : 260,
      height: 200,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: theme.background,
      elevation: 5,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    cardImage: {
      width: "100%",
      height: "100%",
    },
    gradientOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "60%",
      padding: 16,
      justifyContent: "flex-end",
    },
    mallName: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFF",
      marginBottom: 2,
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    locationText: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.9)",
      fontWeight: "500",
    },
    ratingBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    ratingText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#000",
    },
  });
