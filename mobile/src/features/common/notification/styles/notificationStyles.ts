import { Platform, StyleSheet } from "react-native";

export const createNotificationStyles = (theme: any) =>
  StyleSheet.create({
    // Layout shell
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 32,
    },

    // Top app bar
    appBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 12,
      gap: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius ?? 20,
      backgroundColor: theme.secondaryBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    appBarTitleWrap: {
      flex: 1,
      paddingHorizontal: 4,
    },
    appBarTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.4,
    },
    appBarSubtitle: {
      fontSize: 12,
      color: theme.secondaryText,
      fontWeight: "500",
      marginTop: 2,
    },
    markAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: theme.radius ?? 18,
      backgroundColor: theme.primary + "18",
    },
    markAllBtnDisabled: {
      opacity: 0.6,
    },
    markAllText: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.primary,
      letterSpacing: 0.2,
    },

    // Segmented tab bar
    tabsWrapper: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    tabsContainer: {
      flexDirection: "row",
      padding: 4,
      borderRadius: theme.radius ?? 14,
      backgroundColor: theme.secondaryBackground,
      gap: 2,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: theme.radius ?? 11,
      gap: 6,
    },
    activeTabButton: {
      backgroundColor: theme.background,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.secondaryText,
      letterSpacing: 0.2,
    },
    activeTabLabel: {
      color: theme.text,
    },
    tabCountPill: {
      minWidth: 18,
      paddingHorizontal: 5,
      height: 16,
      borderRadius: theme.radius ?? 8,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    tabCountText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#fff",
    },

    // Section header (Today / Yesterday / Earlier)
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 18,
      paddingBottom: 8,
      paddingHorizontal: 4,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.secondaryText,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    sectionCount: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.tertiaryText,
    },
    sectionLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 4,
    },

    // Card
    card: {
      flexDirection: "row",
      padding: 14,
      borderRadius: theme.radius ?? 16,
      backgroundColor: theme.tertiaryBackground,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
      position: "relative",
      overflow: "hidden",
    },
    cardUnread: {
      backgroundColor: theme.secondaryBackground,
      borderColor: theme.primary + "40",
    },
    unreadAccent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: theme.primary,
      borderTopLeftRadius: theme.radius ?? 16,
      borderBottomLeftRadius: theme.radius ?? 16,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: theme.radius ?? 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
    title: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: 0.1,
      lineHeight: 19,
    },
    titleUnread: {
      fontWeight: "800",
    },
    pinnedBadge: {
      width: 18,
      height: 18,
      borderRadius: theme.radius ?? 9,
      backgroundColor: theme.tertiaryBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
      marginBottom: 6,
    },
    channelTag: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.radius ?? 6,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    channelTagText: {
      fontSize: 10,
      fontWeight: "800",
      color: theme.secondaryText,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    timeText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.tertiaryText,
    },
    description: {
      fontSize: 13,
      color: theme.secondaryText,
      lineHeight: 19,
    },
    descriptionUnread: {
      color: theme.text,
    },

    // Rich card
    richBanner: {
      width: "100%",
      height: 150,
      borderRadius: theme.radius ?? 12,
      marginTop: 12,
      marginBottom: 10,
      backgroundColor: theme.secondaryBackground,
    },
    richActionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
    },
    richActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      height: 36,
      borderRadius: theme.radius ?? 18,
      backgroundColor: theme.primary,
    },
    richActionBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    dismissBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      height: 32,
      borderRadius: theme.radius ?? 16,
    },
    dismissText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.secondaryText,
    },

    unreadDot: {
      position: "absolute",
      top: 14,
      right: 14,
      width: 8,
      height: 8,
      borderRadius: theme.radius ?? 4,
      backgroundColor: theme.primary,
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
      paddingBottom: 40,
    },
    emptyIconWrap: {
      width: 110,
      height: 110,
      borderRadius: theme.radius ?? 55,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      letterSpacing: -0.3,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.secondaryText,
      textAlign: "center",
      lineHeight: 20,
      marginTop: 8,
      maxWidth: 320,
    },
  });
