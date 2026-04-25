import { StyleSheet, Platform } from "react-native";
import { Theme } from "@/src/theme/colors";
import { spacing, radius } from "@/src/theme/spacing";

export const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.m,
    backgroundColor: theme.tertiaryBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },

  // Order Card
  orderCard: {
    backgroundColor: theme.background,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: -0.3,
  },
  orderDate: {
    fontSize: 13,
    color: theme.secondaryText,
    marginTop: 2,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.s,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Items Preview
  itemsPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
    marginBottom: spacing.md,
    padding: spacing.s,
    backgroundColor: theme.tertiaryBackground,
    borderRadius: radius.m,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.s,
    backgroundColor: theme.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  moreCount: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: theme.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  moreText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.primary,
  },
  itemsText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },

  // Footer
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalLabel: {
    fontSize: 12,
    color: theme.secondaryText,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.primary,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.primary + "10",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderRadius: radius.pill,
    gap: 4,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.primary,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.text,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.secondaryText,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 24,
    fontWeight: "500",
  },
  shopButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    height: 54,
    borderRadius: radius.m,
    backgroundColor: theme.primary,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
});
