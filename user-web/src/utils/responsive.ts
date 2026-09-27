import { Platform, useWindowDimensions } from "react-native";

/**
 * Desktop-only responsive helpers for the clothing catalog.
 *
 * Contract: EVERYTHING mobile stays byte-identical.
 * - On native (iOS/Android) every helper reports "mobile".
 * - On web with width < 768 every helper reports "mobile".
 * - Only web width >= 1024 gets the full desktop treatment.
 * - 768–1023 is a tablet bridge (3 cols, bottom tabs kept).
 */

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMin: 768,
  desktopMin: 1024,
  wideMin: 1440,
} as const;

export const DESKTOP = {
  /** Centered content column — Flipkart/Myntra style. */
  maxWidth: 1280,
  narrowMaxWidth: 1100,
  gutter: 24,
} as const;

export function getViewportKind(width: number, platform = Platform.OS) {
  if (platform !== "web") return "mobile" as const;
  if (width >= BREAKPOINTS.desktopMin) return "desktop" as const;
  if (width >= BREAKPOINTS.tabletMin) return "tablet" as const;
  return "mobile" as const;
}

/** True only on web + width >= 1024. Safe gate for ALL desktop-only UI. */
export function useIsDesktop() {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;
}

/** True on web + width >= 768 (tablet + desktop). */
export function useIsWide() {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= BREAKPOINTS.tabletMin;
}

export function useViewportKind() {
  const { width } = useWindowDimensions();
  return getViewportKind(width);
}

/**
 * Product-grid columns. Mobile is ALWAYS 2 (unchanged).
 * Tablet 3, desktop 4, wide 5.
 */
export function useProductColumns() {
  const { width } = useWindowDimensions();
  if (Platform.OS !== "web") return 2;
  if (width >= BREAKPOINTS.wideMin) return 5;
  if (width >= BREAKPOINTS.desktopMin) return 4;
  if (width >= BREAKPOINTS.tabletMin) return 3;
  return 2;
}

/**
 * Width of one product card inside a centered max-width container.
 * Mirrors the old `(width - md*2 - sm) / 2` math on mobile exactly.
 */
export function getGridCardWidth(
  windowWidth: number,
  columns: number,
  opts?: { maxWidth?: number; gutter?: number; gap?: number; padding?: number },
) {
  const maxWidth = opts?.maxWidth ?? DESKTOP.maxWidth;
  const gutter = opts?.gutter ?? DESKTOP.gutter;
  const gap = opts?.gap ?? 16;
  const padding = opts?.padding ?? 16;
  // Mobile path — keep the legacy formula untouched.
  if (Platform.OS !== "web" || windowWidth < BREAKPOINTS.tabletMin) {
    return (windowWidth - padding * 2 - 12) / 2;
  }
  const container = Math.min(windowWidth - gutter * 2, maxWidth);
  return (container - gap * (columns - 1)) / columns;
}

/** Centered desktop container style; mobile returns an empty object. */
export function useDesktopContainer(narrow = false) {
  const isDesktop = useIsDesktop();
  const isWide = useIsWide();
  if (!isWide) return {};
  return {
    width: "100%" as const,
    maxWidth: narrow ? DESKTOP.narrowMaxWidth : DESKTOP.maxWidth,
    alignSelf: "center" as const,
    marginHorizontal: "auto" as any,
    paddingHorizontal: isDesktop ? DESKTOP.gutter : 16,
  };
}
