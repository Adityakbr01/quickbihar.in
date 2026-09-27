/**
 * Safe "back" navigation.
 *
 * A bare `router.back()` triggers the dev-only warning
 * "The action 'GO_BACK' was not handled by any navigator" (and does
 * nothing) when the screen was opened directly — deep link, push
 * notification, or web refresh — with an empty navigation stack.
 *
 * Use this helper for every back button / back action so an empty
 * stack falls back to a safe route (defaults to "/", which redirects
 * to the active module home) instead of warning or dead-ending.
 */
interface BackCapableRouter {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: any) => void;
}

export function goBack(
  router: BackCapableRouter,
  fallbackHref: any = "/",
): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref);
  }
}

/**
 * Normalize Expo Router paths to web (react-router) paths.
 *
 * The codebase shares screen code with the Expo native app, so many
 * call-sites still navigate to mobile routes like:
 *   "/(tabs)/clothing/home", "/(tabs)/clothing/cart",
 *   "/(tabs)/clothing/search", "/jewelery/(tabs)/cart", ...
 *
 * The web router only defines "/clothing/home", "/jewelery/cart", etc.
 * Without normalization those navigations (or a pasted URL) hit the
 * catch-all "*" route and render a blank redirect loop.
 */
export function normalizeExpoPathForWeb(input: string): string {
  if (!input || typeof input !== "string") return "/";
  // Split off query/hash, normalize pathname only.
  const qIndex = input.search(/[?#]/);
  const pathname = qIndex === -1 ? input : input.slice(0, qIndex);
  const suffix = qIndex === -1 ? "" : input.slice(qIndex);

  let normalized = pathname
    // "/(tabs)/clothing/home" -> "/clothing/home"
    // "/jewelery/(tabs)/cart" -> "/jewelery/cart"
    .replace(/\/\(tabs\)/g, "")
    // "(tabs)/clothing/home" (missing leading slash) -> "/clothing/home"
    .replace(/(^|\/)\(tabs\)\/?/g, "$1");

  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  // Collapse accidental "//".
  normalized = normalized.replace(/\/{2,}/g, "/");

  return `${normalized}${suffix}`;
}
