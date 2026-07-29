import { StyleSheet } from "react-native";
import { spacing } from "@/src/theme/spacing";

export const createFilterBottomSheetStyles = (theme: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "flex-end",
    },
    bottomSheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      maxHeight: "85%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 10,
    },
    sheetHandleContainer: {
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    sheetHandle: {
      width: 48,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.border,
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
    },
    sheetTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.5,
    },
    closeButton: {
      padding: 4,
      borderRadius: 20,
      backgroundColor: theme.secondaryBackground || "#f3f4f6",
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    pillsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    pillButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 100,
      borderWidth: 1,
      gap: 8,
      borderColor: theme.border,
      backgroundColor: theme.secondaryBackground || theme.background,
    },
    pillButtonActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    pillText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: "600",
    },
    pillTextActive: {
      color: "#fff",
    },
    checkboxActive: {
      color: theme.primary,
    },
    checkboxInactive: {
      color: theme.secondaryText || "#9ca3af",
    },
    sheetFooter: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderColor: theme.border,
    },
    clearBtn: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      backgroundColor: theme.background,
    },
    applyBtn: {
      flex: 2,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    clearBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    applyBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 0.2,
    },
  });
