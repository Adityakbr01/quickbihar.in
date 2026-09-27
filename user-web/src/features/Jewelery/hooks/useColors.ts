import colors from "../constants/jeweleryColors";
import { useTheme } from "@/theme/Provider/ThemeProvider";

/**
 * Returns the design tokens for the active app theme mode (light/dark) for the Jewelery module.
 * Synchronized with the global ThemeProvider.
 */
export function useColors() {
  const theme = useTheme();
  const isDark = theme.isDark;

  const palette =
    isDark && "dark" in colors
      ? (colors as any).dark
      : colors.light;

  return { ...palette, isDark, radius: colors.radius };
}

export default useColors;
