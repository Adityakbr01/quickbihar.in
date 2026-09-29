/**
 * Returns the correct top padding for screens with a custom header.
 * - Web: 0 (browser chrome is the safe area; every screen already adds
 *   its own +8/+12 breathing room — anything more is a dead gap)
 *
 * ponytail: eliminates the repeated 2-liner from every Jewelery screen.
 * If the web header height changes, update here.
 */
export function useTopPad(): number {
  return 0;
}
