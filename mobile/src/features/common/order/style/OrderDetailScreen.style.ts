import { StyleSheet, Platform } from "react-native";
import { Theme } from "@/src/theme/colors";
import { spacing, radius } from "@/src/theme/spacing";

export const createOrderDetailStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: radius.m,
      backgroundColor: theme.tertiaryBackground,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.3,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    helpButton: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: radius.pill,
      backgroundColor: theme.tertiaryBackground,
      borderWidth: 1,
      borderColor: theme.border,
    },
    helpButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: theme.tertiaryBackground,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: 60,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.secondaryText,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      backgroundColor: theme.background,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginTop: 12,
    },
    errorSubtitle: {
      fontSize: 14,
      color: theme.secondaryText,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: radius.m,
    },
    retryButtonText: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: 14,
    },

    // Order Meta / ID Row
    orderIdRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    orderIdContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    orderIdText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    orderDateText: {
      fontSize: 12,
      color: theme.tertiaryText,
    },

    // Sub-order Tab Selector (when multi-vendor)
    subOrderTabsContainer: {
      marginBottom: 14,
    },
    subOrderTab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.m,
      backgroundColor: theme.tertiaryBackground,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 8,
    },
    subOrderTabActive: {
      backgroundColor: theme.primary + "15",
      borderColor: theme.primary,
    },
    subOrderTabText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    subOrderTabTextActive: {
      color: theme.primary,
      fontWeight: "700",
    },

    // Items Section Header
    itemsSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      marginTop: 4,
    },
    itemsSectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.2,
    },
    itemsCountBadge: {
      backgroundColor: theme.tertiaryBackground,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.border,
    },
    itemsCountText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.primary,
    },

    // Product Card (Rich ecommerce card)
    productCard: {
      backgroundColor: theme.background,
      borderRadius: radius.xl,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    productCardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
    },
    productImageContainer: {
      width: 80,
      height: 80,
      borderRadius: radius.m,
      backgroundColor: theme.tertiaryBackground,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    productImage: {
      width: "100%",
      height: "100%",
    },
    productInfo: {
      flex: 1,
    },
    productTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
      lineHeight: 20,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    chip: {
      backgroundColor: theme.tertiaryBackground,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: radius.s,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chipText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    productPriceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
    },
    productPrice: {
      fontSize: 15,
      fontWeight: "900",
      color: theme.text,
    },
    productUnitPrice: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.secondaryText,
    },
    productCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    storeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    storeBadgeText: {
      fontSize: 11,
      color: theme.tertiaryText,
    },
    viewProductLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    viewProductText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.primary,
    },

    // OTP Card
    otpCard: {
      backgroundColor: "#f0fdf4",
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1.5,
      borderColor: "#86efac",
      ...Platform.select({
        ios: {
          shadowColor: "#10b981",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    otpHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    otpTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    otpTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#15803d",
    },
    otpBadge: {
      backgroundColor: "#bbf7d0",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    otpBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#166534",
    },
    otpCodeRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginVertical: 6,
    },
    otpDigitBox: {
      width: 42,
      height: 48,
      borderRadius: radius.m,
      backgroundColor: "#ffffff",
      borderWidth: 1.5,
      borderColor: "#4ade80",
      justifyContent: "center",
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    otpDigitText: {
      fontSize: 22,
      fontWeight: "900",
      color: "#15803d",
    },
    otpSubtitle: {
      fontSize: 12,
      color: "#166534",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 16,
    },

    // Status / Stepper Card
    statusCard: {
      backgroundColor: theme.background,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    statusCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    statusCardTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.3,
    },
    statusCardSubtitle: {
      fontSize: 14,
      color: theme.secondaryText,
      marginTop: 6,
      lineHeight: 20,
    },

    // Horizontal Stepper
    stepperContainer: {
      marginVertical: 18,
    },
    stepperTrack: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      position: "relative",
    },
    stepperStep: {
      alignItems: "center",
      zIndex: 2,
    },
    stepperCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.tertiaryBackground,
      borderWidth: 2,
      borderColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
    },
    stepperCircleActive: {
      backgroundColor: "#10b981",
      borderColor: "#10b981",
    },
    stepperCircleCurrent: {
      backgroundColor: "#10b981",
      borderColor: "#a7f3d0",
      borderWidth: 4,
    },
    stepperLine: {
      flex: 1,
      height: 3,
      backgroundColor: theme.border,
      marginHorizontal: -4,
      zIndex: 1,
    },
    stepperLineActive: {
      backgroundColor: "#10b981",
    },
    stepperLabelsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    stepperLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.secondaryText,
      textAlign: "center",
      width: 80,
    },
    stepperLabelActive: {
      color: theme.text,
      fontWeight: "700",
    },
    stepperSubLabel: {
      fontSize: 11,
      color: theme.tertiaryText,
      textAlign: "center",
      marginTop: 2,
    },

    // Vertical Timeline (Detailed view)
    verticalTimeline: {
      marginTop: 16,
      paddingLeft: 4,
    },
    timelineItem: {
      flexDirection: "row",
      position: "relative",
      paddingBottom: 22,
    },
    timelineItemLast: {
      paddingBottom: 0,
    },
    timelineLine: {
      position: "absolute",
      left: 11,
      top: 24,
      bottom: 0,
      width: 2,
      backgroundColor: theme.border,
    },
    timelineLineActive: {
      backgroundColor: "#10b981",
    },
    timelineDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.tertiaryBackground,
      borderWidth: 2,
      borderColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
      zIndex: 2,
    },
    timelineDotActive: {
      backgroundColor: "#10b981",
      borderColor: "#10b981",
    },
    timelineDotCurrent: {
      backgroundColor: "#10b981",
      borderColor: "#bbf7d0",
      borderWidth: 3,
    },
    timelineContent: {
      flex: 1,
    },
    timelineTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    timelineTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
    },
    timelineDate: {
      fontSize: 12,
      color: theme.tertiaryText,
    },
    timelineDesc: {
      fontSize: 13,
      color: theme.secondaryText,
      marginTop: 3,
      lineHeight: 18,
    },

    // Delivery Info Callout / Live tracking button
    infoCallout: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.tertiaryBackground,
      borderRadius: radius.m,
      padding: 12,
      marginTop: 12,
    },
    infoCalloutText: {
      flex: 1,
      fontSize: 13,
      color: theme.secondaryText,
      lineHeight: 18,
    },
    trackMapButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.primary,
      borderRadius: radius.m,
      paddingVertical: 12,
      marginTop: 14,
    },
    trackMapButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#ffffff",
    },

    // Delivery Executive / Rider Box
    riderBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.tertiaryBackground,
      borderRadius: radius.m,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    riderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    riderAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary + "20",
      justifyContent: "center",
      alignItems: "center",
    },
    riderName: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
    },
    riderRole: {
      fontSize: 12,
      color: theme.secondaryText,
    },
    riderCallButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#10b981",
      justifyContent: "center",
      alignItems: "center",
    },

    // Section Card Base
    sectionCard: {
      backgroundColor: theme.background,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    sectionCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.2,
    },

    // Address Details
    addressName: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
      marginTop: 10,
    },
    addressPhone: {
      fontSize: 13,
      color: theme.secondaryText,
      marginTop: 2,
    },
    addressText: {
      fontSize: 13,
      color: theme.secondaryText,
      marginTop: 6,
      lineHeight: 19,
    },

    // Price Details (Matches Flipkart/Modern Ecommerce UI)
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    priceSubRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 5,
      paddingLeft: 12,
    },
    priceLabel: {
      fontSize: 14,
      color: theme.secondaryText,
    },
    priceSubLabel: {
      fontSize: 13,
      color: theme.tertiaryText,
      textDecorationLine: "underline",
      textDecorationStyle: "dotted",
    },
    priceValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    priceSubValue: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.secondaryText,
    },
    discountValue: {
      color: "#10b981",
      fontWeight: "700",
    },
    freeValue: {
      color: "#10b981",
      fontWeight: "700",
    },
    priceDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 10,
      borderStyle: "dashed",
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 6,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "900",
      color: theme.text,
    },

    // Paid By Box
    paidByBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.tertiaryBackground,
      borderRadius: radius.m,
      padding: 12,
      marginTop: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    paidByLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    paidByText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    paidStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.s,
      backgroundColor: "#10b98115",
    },
    paidStatusText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#10b981",
    },

    // Offers Earned Banner
    offersCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.tertiaryBackground,
      borderRadius: radius.xl,
      padding: 14,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    offersLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    offersText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
    },

    // Action Buttons Row
    actionsContainer: {
      marginTop: 8,
      gap: 12,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: radius.m,
    },
    primaryBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#ffffff",
    },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.tertiaryBackground,
      paddingVertical: 14,
      borderRadius: radius.m,
      borderWidth: 1,
      borderColor: theme.border,
    },
    secondaryBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
    },
  });
