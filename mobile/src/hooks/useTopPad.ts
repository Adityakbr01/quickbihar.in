import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Returns the correct top padding for screens with a custom header.
 * - Web: fixed 16px breathing room (no status bar / notch on web)
 * - Native: safe area inset top
 *
 * ponytail: eliminates the repeated `Platform.OS === "web" ? 16 : insets.top`
 * 2-liner from every Jewelery screen. If the web header height changes, update here.
 */
export function useTopPad(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === "web" ? 16 : insets.top;
}
