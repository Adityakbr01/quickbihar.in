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
