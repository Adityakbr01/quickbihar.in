import { useEffect, useState } from "react";

/**
 * Desktop-only responsive helpers for the clothing catalog.
 * Pure React + web — no primitives, no react-native.
 *
 * - width < 768 → "mobile"
 * - 768–1023 → tablet bridge (3 cols, bottom tabs kept)
 * - width >= 1024 → full desktop treatment
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

/** Live window width (SSR-safe, defaults to desktop-ish 1200). */
export function useWindowWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

export function getViewportKind(width: number, _platform: string = "web") {
  if (width >= BREAKPOINTS.desktopMin) return "desktop" as const;
  if (width >= BREAKPOINTS.tabletMin) return "tablet" as const;
  return "mobile" as const;
}

/** Height of the mobile BottomTabBar (see components/common/BottomTabBar). */
export const BOTTOM_TAB_BAR_HEIGHT = 60;

/**
 * Height a sticky bottom bar (Add to Bag, checkout CTA, ...) must be lifted
 * so the tab bar never covers it. Desktop renders no tab bar → offset 0.
 */
export function useStickyBarBottomOffset() {
  const width = useWindowWidth();
  return width < BREAKPOINTS.desktopMin ? BOTTOM_TAB_BAR_HEIGHT : 0;
}

/** True only on width >= 1024. Safe gate for ALL desktop-only UI. */
export function useIsDesktop() {
  const width = useWindowWidth();
  return width >= BREAKPOINTS.desktopMin;
}

/** True on width >= 768 (tablet + desktop). */
export function useIsWide() {
  const width = useWindowWidth();
  return width >= BREAKPOINTS.tabletMin;
}

export function useViewportKind() {
  const width = useWindowWidth();
  return getViewportKind(width);
}

/**
 * Product-grid columns. Mobile is ALWAYS 2 (unchanged).
 * Tablet 3, desktop 4, wide 5.
 */
export function useProductColumns() {
  const width = useWindowWidth();
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
  if (windowWidth < BREAKPOINTS.tabletMin) {
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
    marginLeft: "auto" as const,
    marginRight: "auto" as const,
    paddingLeft: isDesktop ? DESKTOP.gutter : 16,
    paddingRight: isDesktop ? DESKTOP.gutter : 16,
  };
}
