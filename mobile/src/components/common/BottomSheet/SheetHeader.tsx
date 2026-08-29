import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { spacing } from "@/src/theme/spacing";
import type { SheetHeaderProps } from "./types";

/**
 * Standard sheet header — title (and optional subtitle) on the left,
 * optional right slot, and an optional close button on the far right.
 *
 * Pass as the `header` prop of <Sheet /> to pin it to the top of the sheet:
 *
 * @example
 *   <Sheet header={<SheetHeader title="Coupons" onClose={...} right={<Badge/>} />}>
 *     ...
 *   </Sheet>
 */
export const SheetHeader: React.FC<SheetHeaderProps> = ({
  title,
  subtitle,
  right,
  onClose,
  hideCloseButton = false,
  style,
}) => {
  const theme = useTheme() as any;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const showClose = !hideCloseButton && !!onClose;
  const hasRight = !!right || showClose;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {!!title && <Text style={styles.title}>{title}</Text>}
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {hasRight && (
        <View style={styles.right}>
          {right}
          {showClose && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: theme.background,
    },
    left: {
      flex: 1,
      flexShrink: 1,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: theme.secondaryText,
      marginTop: 2,
    },
    closeButton: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: theme.secondaryBackground ?? "#f3f4f6",
    },
  });
