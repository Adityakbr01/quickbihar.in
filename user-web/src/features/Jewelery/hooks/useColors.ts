import { useColorScheme } from "react-native";

import colors from "@/src/features/Jewelery/constants/jeweleryColors";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

/**
 * Returns the design tokens for the active app theme mode (light/dark).
 * Synchronized with the global ThemeProvider switcher.
 */
export function useColors() {
  const scheme = useColorScheme();
  let isDark = scheme === "dark";
  try {
    const theme = useTheme();
    if (theme && typeof theme.isDark === "boolean") {
      isDark = theme.isDark;
    }
  } catch {}

  const palette =
    isDark && "dark" in colors
      ? (colors as any).dark
      : colors.light;
  return { ...palette, isDark, radius: colors.radius };
}
