import { StyleSheet, Platform } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

export const createOrderStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.tertiaryBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: -0.5,
  },
  section: {
    backgroundColor: theme.tertiaryBackground,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.text,
    letterSpacing: -0.3,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.primary,
  },
  // Address Card
  addressContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.primary + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 14,
    color: theme.text,
    marginTop: 6,
    fontWeight: "600",
  },
  // Item List
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: theme.tertiaryBackground,
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: theme.secondaryText,
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.text,
    textAlign: "right",
  },
  // Summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 15,
    color: theme.secondaryText,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.text,
  },
  discountText: {
    color: "#059669", // Emerald 600
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 18,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.primary,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
    backgroundColor: theme.background + "D0", // Translucent
  },
  payButton: {
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.primary,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  payButtonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  payButtonAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },
  payButtonDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 16,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  // Success Screen & Receipt
  successContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  successScroll: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: theme.text,
    marginTop: 20,
    textAlign: "center",
    letterSpacing: -1,
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.secondaryText,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
    marginBottom: 32,
  },
  receiptCard: {
    backgroundColor: theme.tertiaryBackground,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.secondaryText,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  receiptId: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.primary,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 20,
    borderStyle: "dashed",
  },
  receiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  receiptItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  receiptItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  receiptItemVariant: {
    fontSize: 13,
    color: theme.secondaryText,
    marginTop: 2,
  },
  receiptItemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.text,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  receiptTotalLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
  },
  receiptTotalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.primary,
  },
  buttonGroup: {
    marginTop: 40,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: theme.primary,
  },
  secondaryActionButton: {
    backgroundColor: theme.tertiaryBackground,
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  shareIcon: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.tertiaryBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
});
