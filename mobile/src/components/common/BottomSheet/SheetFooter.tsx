import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { spacing } from "@/src/theme/spacing";
import type { SheetFooterProps } from "./types";

/**
 * Sticky bottom area for action buttons (e.g. Clear All / Apply).
 *
 * Pass as the `footer` prop of <Sheet /> so it stays pinned when content
 * scrolls:
 *
 * @example
 *   <Sheet
 *     footer={
 *       <SheetFooter>
 *         <Button title="Clear" />
 *         <Button title="Apply" />
 *       </SheetFooter>
 *     }
 *   />
 */
export const SheetFooter: React.FC<SheetFooterProps> = ({ children, style }) => {
  const theme = useTheme() as any;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View style={[styles.container, style]}>{children}</View>;
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: theme.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
  });
