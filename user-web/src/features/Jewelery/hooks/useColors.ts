import { useEffect, useState } from "react";

import colors from "@/src/features/Jewelery/constants/jeweleryColors";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

function getSystemIsDark(): boolean {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Returns the design tokens for the active app theme mode (light/dark).
 * Synchronized with the global ThemeProvider switcher.
 */
export function useColors() {
  const [systemIsDark, setSystemIsDark] = useState<boolean>(getSystemIsDark);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    try {
      mq.addEventListener("change", onChange);
    } catch {
      // Safari < 14 fallback
      (mq as any).addListener?.(onChange);
    }
    setSystemIsDark(mq.matches);
    return () => {
      try {
        mq.removeEventListener("change", onChange);
      } catch {
        (mq as any).removeListener?.(onChange);
      }
    };
  }, []);

  let isDark = systemIsDark;
  try {
    const theme = useTheme();
    if (theme && typeof (theme as any).isDark === "boolean") {
      isDark = (theme as any).isDark;
    }
  } catch {}

  const palette =
    isDark && "dark" in colors
      ? (colors as any).dark
      : colors.light;
  return { ...palette, isDark, radius: colors.radius };
}
