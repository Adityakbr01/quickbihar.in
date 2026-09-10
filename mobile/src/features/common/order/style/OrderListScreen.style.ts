import { StyleSheet } from "react-native";
import { Theme } from "@/src/theme/colors";

// Same visual language as NotificationScreen: app bar with title + subtitle,
// flat tertiary cards, pill CTA. No shadows — borders do the separation.
export const createStyles = (theme: Theme) => StyleSheet.create({
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

  // Top app bar (mirrors notificationStyles appBar)
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
    borderRadius: 20,
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

  // Order Card (mirrors notificationStyles card)
  orderCard: {
    backgroundColor: theme.tertiaryBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.text,
    letterSpacing: -0.3,
  },
  orderDate: {
    fontSize: 12,
    color: theme.secondaryText,
    marginTop: 4,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Items Preview
  itemsPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    padding: 10,
    backgroundColor: theme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.secondaryBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  moreCount: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.secondaryBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.primary,
  },
  itemsText: {
    flex: 1,
    fontSize: 13,
    color: theme.secondaryText,
    fontWeight: "600",
    marginLeft: 2,
  },

  // Footer
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalLabel: {
    fontSize: 11,
    color: theme.secondaryText,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.text,
    marginTop: 2,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.primary + "18",
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    gap: 4,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.primary,
    letterSpacing: 0.2,
  },

  // Empty State (mirrors notificationStyles empty state)
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
    borderRadius: 55,
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
  shopButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
