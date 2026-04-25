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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.background,
  },
  backButton: {
    padding: spacing.xs,
    borderRadius: radius.m,
    backgroundColor: theme.tertiaryBackground,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.text,
    flex: 1,
    marginLeft: spacing.md,
    letterSpacing: -0.5,
  },
  filterButton: {
    padding: spacing.xs,
    borderRadius: radius.m,
    backgroundColor: theme.tertiaryBackground,
  },
  
  // Search Bar
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.background,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.tertiaryBackground,
    borderRadius: radius.m,
    paddingHorizontal: spacing.sm,
    height: 48,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: spacing.s,
    fontSize: 15,
    color: theme.text,
    fontWeight: "600",
  },

  // Tabs
  filterTabs: {
    paddingVertical: spacing.s,
    backgroundColor: theme.background,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderRadius: radius.pill,
    marginRight: spacing.s,
    backgroundColor: theme.tertiaryBackground,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
  },
  tabTextActive: {
    color: "#fff",
  },

  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },

  // Order Card
  orderCard: {
    padding: spacing.md,
    borderRadius: radius.l,
    borderWidth: 1,
    marginBottom: spacing.md,
    backgroundColor: theme.background,
    borderColor: theme.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: -0.5,
  },
  customerName: {
    fontSize: 13,
    color: theme.secondaryText,
    marginTop: 2,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.s,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  orderDate: {
    fontSize: 12,
    color: theme.tertiaryText,
    fontWeight: "600",
  },
  orderAmount: {
    fontSize: 17,
    fontWeight: "900",
    color: theme.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : spacing.lg,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: -0.5,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  actionButton: {
    width: "48%",
    padding: spacing.md,
    borderRadius: radius.l,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: spacing.s,
    backgroundColor: theme.tertiaryBackground,
  },
  actionLabel: {
    marginTop: spacing.xs,
    fontWeight: "800",
    fontSize: 14,
  },
  inputContainer: {
    marginTop: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.text,
    marginBottom: spacing.s,
  },
  input: {
    borderRadius: radius.m,
    borderWidth: 1.5,
    borderColor: theme.border,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
    color: theme.text,
    backgroundColor: theme.secondaryBackground,
    fontSize: 15,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: theme.secondaryText,
    fontWeight: "600",
  },
});
