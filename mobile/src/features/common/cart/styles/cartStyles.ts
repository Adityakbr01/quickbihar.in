import { StyleSheet, Platform } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

export const createCartStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    ...(Platform.OS === "web" && {
      alignItems: "center",
    }),
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 800,
  },
  scrollContent: {
    paddingBottom: Platform.OS === "web" ? 220 : 150, // More space on web for floating footer
  },
  walletLottie: {
    width: 60,
    height: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.text,
  },
  itemCount: {
    fontSize: 14,
    color: theme.secondaryText,
    marginTop: 2,
  },
  // Item Card Styles
  card: {
    flexDirection: "row",
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.tertiaryBackground,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        // elevation: 2,
      },
    }),
  },
  closeBTN: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  image: {
    width: 90,
    height: 120,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.text,
  },
  itemVariant: {
    fontSize: 13,
    color: theme.secondaryText,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.background,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.tertiaryBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    marginHorizontal: 12,
    color: theme.text,
  },
  // Summary Styles
  summaryContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: theme.secondaryText,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.primary,
  },
  // Footer Styles
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    zIndex: 1000,
    ...(Platform.OS === "web" && {
      bottom: 55,
      left: "auto",
      right: "auto",
      width: "100%",
      maxWidth: 600,
      // borderRadius: 20,
      borderWidth: 0,
      borderColor: theme.border,
      // shadowColor: "#000",
      // shadowOffset: { width: 0, height: 4 },
      // shadowOpacity: 0.1,
      // shadowRadius: 12,
      // elevation: 5,
    }),
  },
  checkoutButton: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 60,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingBottom: Platform.OS === "web" ? 100 : 40, // Space for web tab bar
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.text,
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.secondaryText,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },
  shopNowButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopNowText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Coupon Styles
  couponContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 12,
  },
  couponInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.tertiaryBackground,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 54,
    borderWidth: 1,
    borderColor: theme.border,
  },
  couponInput: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
    fontWeight: "600",
    paddingRight: 8,
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  couponStatusText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "600",
  },
  appliedCouponContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.primary + "10", // 10% opacity
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.primary + "30",
    borderStyle: "dashed",
  },
  appliedCouponInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  couponBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  couponBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  appliedCouponText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: "700",
  },
  removeCouponText: {
    fontSize: 13,
    color: theme.error || "#ff4444",
    fontWeight: "700",
  },
});
