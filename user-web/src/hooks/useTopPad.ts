import { Platform } from "@/components/primitives";
import { useSafeAreaInsets } from "@/src/hooks/useSafeAreaInsets";

/**
 * Returns the correct top padding for screens with a custom header.
 * - Web: 0 (browser chrome is the safe area; every screen already adds
 *   its own +8/+12 breathing room — anything more is a dead gap)
 * - Native: safe area inset top
 *
 * ponytail: eliminates the repeated `Platform.OS === "web" ? 16 : insets.top`
 * 2-liner from every Jewelery screen. If the web header height changes, update here.
 */
export function useTopPad(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === "web" ? 0 : insets.top;
}
