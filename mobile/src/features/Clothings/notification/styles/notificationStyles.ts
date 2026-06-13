import { StyleSheet } from "react-native";
import { Theme } from "@/src/theme/colors";

export const createNotificationStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    unreadCountText: {
      fontSize: 14,
      color: theme.secondaryText,
      fontWeight: "500",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    markAllText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primary,
    },
    tabsContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      backgroundColor: theme.background,
    },
    tabButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.tertiaryBackground,
      borderWidth: 1,
      borderColor: theme.border,
    },
    activeTabButton: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    activeTabLabel: {
      color: "#FFFFFF",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    card: {
      flexDirection: "row",
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      position: "relative",
    },
    cardUnread: {
      borderColor: theme.primary + "30",
      backgroundColor: theme.primary + "05",
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    cardRich: {
      paddingBottom: 16,
    },
    richBannerImage: {
      width: "100%",
      height: 160,
      borderRadius: 8,
      marginTop: 12,
      backgroundColor: theme.secondaryBackground,
    },
    notificationImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
      backgroundColor: theme.secondaryBackground,
      marginRight: 12,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.secondaryBackground,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    iconWrapperUnread: {
      backgroundColor: theme.primary + "10",
    },
    contentWrapper: {
      flex: 1,
      justifyContent: "center",
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 4,
      paddingRight: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      flex: 1,
      marginRight: 8,
    },
    titleUnread: {
      color: theme.text,
    },
    timeText: {
      fontSize: 11,
      color: theme.secondaryText,
    },
    description: {
      fontSize: 13,
      color: theme.secondaryText,
      lineHeight: 18,
    },
    unreadDot: {
      position: "absolute",
      top: 14,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
      gap: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.secondaryText,
      textAlign: "center",
      lineHeight: 20,
    },
    backButton: {
      padding: 4,
    },
    richActionButton: {
      width: "100%",
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 12,
    },
    richActionButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },
  });
