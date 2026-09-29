import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BREAKPOINTS, DESKTOP, useWindowWidth } from "@/src/utils/responsive";
import { DesktopFooter } from "./DesktopFooter";

/**
 * Centers any clothing-catalog screen on desktop web (max 1280px).
 * On mobile web it renders children unchanged — zero visual diff.
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
  const width = useWindowWidth();
  const theme = useTheme() as any;

  const isWide = width >= BREAKPOINTS.tabletMin;
  const isDesktop = width >= BREAKPOINTS.desktopMin;

  if (!isWide) return <>{children}</>;

  return (
    <div className="w-full flex-1" style={{ backgroundColor: theme.background }}>
      <div
        className="mx-auto w-full flex-1"
        style={{
          maxWidth: narrow ? DESKTOP.narrowMaxWidth : DESKTOP.maxWidth,
          paddingLeft: isDesktop ? DESKTOP.gutter : 16,
          paddingRight: isDesktop ? DESKTOP.gutter : 16,
        }}
      >
        {children}
      </div>
      {withFooter && isDesktop ? <DesktopFooter /> : null}
    </div>
  );
};

export default DesktopShell;
