import { useTheme } from "./Provider/ThemeProvider";
import { useColors } from "@/features/Jewelery/hooks/useColors";
import { useFoodColors } from "@/features/Food/hooks/useFoodColors";

export type ModuleVariant = "default" | "clothing" | "jewelery" | "food";

/**
 * Returns the theme tokens for a module surface.
 * - "jewelery" maps tokens to the jewellery palette (ivory/ink/gold/pearl, light + dark aware)
 * - "food" maps tokens to the food palette (rose/crimson, hot & fresh)
 * - "clothing" / "default" uses the default store module or global app theme
 */
export function useModuleTheme(variant?: ModuleVariant): any {
  const theme = useTheme() as any;
  const activeVariant = variant || theme.activeModule || "default";
  const jewelry = useColors();
  const food = useFoodColors();

  if (activeVariant === "jewelery") {
    return {
      ...theme,
      background: jewelry.ivory,
      text: jewelry.ink,
      primary: jewelry.gold,
      secondaryText: jewelry.warmGray,
      tertiaryText: jewelry.warmGray,
      secondaryBackground: jewelry.pearl,
      tertiaryBackground: jewelry.champagne,
      border: jewelry.midGray,
      error: "#dc2626",
      radius: 2,
    };
  }

  if (activeVariant === "food") {
    return {
      ...theme,
      primary: food.primary,
      secondaryBackground: food.bannerBg,
      border: food.bannerBorder,
      cardBg: food.cardBg,
      radius: 12,
    };
  }

  return theme;
}

export default useModuleTheme;
