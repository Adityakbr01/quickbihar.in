import { useTheme } from "./Provider/ThemeProvider";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

export type ModuleVariant = "default" | "jewelery";

/**
 * Returns the theme tokens for a module surface. The default variant is
 * the global app theme untouched; "jewelery" remaps the same token names
 * onto the jewellery palette (ivory/ink/gold/pearl, light + dark aware)
 * so a shared component matches the catalogue vibe with zero logic forks.
 *
 * Always returns an `any`-typed object — consumers already treat the
 * theme as such.
 */
export function useModuleTheme(variant: ModuleVariant = "default"): any {
  const theme = useTheme() as any;
  const jewelry = useColors();

  if (variant !== "jewelery") return theme;

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
    // Jewellery surfaces are sharp-cornered (radius 2); the default theme
    // carries no radius token, so components fall back to their own radii.
    radius: 2,
  };
}
