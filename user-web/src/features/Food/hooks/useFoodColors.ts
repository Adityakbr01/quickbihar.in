import foodColors from "../constants/foodColors";
import { useTheme } from "@/theme/Provider/ThemeProvider";

export function useFoodColors() {
  const theme = useTheme();
  const isDark = theme.isDark;

  const palette = isDark ? foodColors.dark : foodColors.light;
  return { ...palette, primary: foodColors.primary, badgeColor: foodColors.badgeColor, isDark };
}

export default useFoodColors;
