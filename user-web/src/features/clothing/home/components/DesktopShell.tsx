import React from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";
import { DesktopFooter } from "./DesktopFooter";

/**
 * Centers any clothing-catalog screen on desktop web (max 1280px).
 * On native + mobile web it renders children unchanged — zero visual diff.
 */
export const DesktopShell = ({
  children,
  narrow = false,
  withFooter = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
  withFooter?: boolean;
}) => {
  const { width } = useWindowDimensions();
  const theme = useTheme() as any;

  const isWide = Platform.OS === "web" && width >= BREAKPOINTS.tabletMin;
  const isDesktop = Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;

  if (!isWide) return <>{children}</>;

  return (
    <View style={[styles.outer, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.inner,
          {
            maxWidth: narrow ? DESKTOP.narrowMaxWidth : DESKTOP.maxWidth,
            paddingHorizontal: isDesktop ? DESKTOP.gutter : 16,
          },
        ]}
      >
        {children}
      </View>
      {withFooter && isDesktop ? <DesktopFooter /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  outer: { flex: 1, width: "100%" },
  inner: {
    width: "100%",
    alignSelf: "center",
    marginHorizontal: "auto" as any,
    flex: 1,
  },
});

export default DesktopShell;
