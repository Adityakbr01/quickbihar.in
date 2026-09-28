import {
  useParams,
  useSearchParams,
  type NavigateFunction,
} from "react-router-dom";

/**
 * Safe "back" navigation (react-router).
 *
 * A bare `navigate(-1)` does nothing when the screen was opened directly —
 * deep link, push notification, or web refresh — with an empty navigation
 * stack. Use this helper for every back button / back action so an empty
 * stack falls back to a safe route (defaults to "/", which redirects
 * to the active module home) instead of dead-ending.
 */
export function goBack(
  navigate: NavigateFunction,
  fallbackHref: NavigationHref = "/",
): void {
  if (typeof window !== "undefined" && window.history.length > 1) {
    navigate(-1);
  } else {
    navigate(toWebPath(fallbackHref), { replace: true });
  }
}

/** A navigation destination: a plain path or a pathname + params pair. */
export type NavigationHref =
  | string
  | {
      pathname?: string;
      params?: Record<string, any>;
    };

/**
 * Push navigation via react-router.
 *
 * Accepts legacy `{ pathname: "/product/[id]", params: { id } }` shapes
 * (dynamic `[id]` segments are substituted, leftover params become a
 * query string) as well as plain paths (legacy `/(tabs)` groups stripped).
 */
export function goTo(navigate: NavigateFunction, href: NavigationHref): void {
  navigate(toWebPath(href));
}

/** Replace navigation via react-router (same path handling as {@link goTo}). */
export function replaceTo(
  navigate: NavigateFunction,
  href: NavigationHref,
): void {
  navigate(toWebPath(href), { replace: true });
}

/**
 * Normalize any in-app destination to a web (react-router) path.
 *
 * The codebase shares screen code with the native app, so many
 * call-sites still navigate to mobile-style routes like:
 *   "/(tabs)/clothing/home", "/jewelery/(tabs)/cart",
 *   { pathname: "/product/[id]", params: { id } }
 *
 * The web router only defines "/clothing/home", "/product/:id", etc.
 * Without normalization those navigations hit the catch-all "*" route.
 */
export function toWebPath(href: NavigationHref): string {
  if (!href) return "/";
  let path: string;
  let params: Record<string, any> | null = null;
  if (typeof href === "string") {
    path = href;
  } else {
    path = href.pathname || "/";
    if (href.params && typeof href.params === "object") {
      params = { ...href.params };
    }
  }
  // Substitute dynamic segments like "/product/[id]" with actual values.
  // Leftover params become a query string.
  if (params) {
    path = path.replace(/\[([^\]/]+)\]/g, (_m: string, key: string) => {
      if (params![key] !== undefined && params![key] !== null) {
        const value = String(params![key]);
        delete params![key];
        return encodeURIComponent(value);
      }
      return _m;
    });
  }
  const remaining = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
      )
    : null;
  const query =
    remaining && Object.keys(remaining).length
      ? `?${new URLSearchParams(remaining as Record<string, string>).toString()}`
      : "";
  return normalizeExpoPathForWeb(`${path}${query}`);
}

/**
 * Route params for the current screen (react-router).
 *
 * Merges path params (`/product/:id`) and query params (`?orderId=...`)
 * so screens keep working no matter how they were opened.
 */
export function useRouteParams<
  T extends Record<string, string> = Record<string, string>,
>(): T {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const query = Object.fromEntries(searchParams.entries());
  return { ...params, ...query } as T;
}

/**
 * Normalize Expo-style paths to web (react-router) paths.
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
