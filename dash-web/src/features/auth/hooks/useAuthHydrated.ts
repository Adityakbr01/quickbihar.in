import { useSyncExternalStore } from "react";
import { useAuthStore } from "../store/authStore";

/**
 * Subscribes to the zustand+persist hydration lifecycle.
 *
 * Why this exists: in React 19, the legacy `useEffect + setState` pattern for
 * tracking zustand persist hydration is racy — between mount and the
 * setState microtask firing, the component renders with `hasHydrated: false`
 * and shows the blank-screen guard. `useSyncExternalStore` is the
 * React-19-recommended pattern that subscribes synchronously to the
 * hydration state and avoids the flash-of-blank-screen.
 *
 * Mirrors the pattern in web/src/components/landing/Header.tsx:63-69.
 *
 * Returns `true` once `persistApi.hasHydrated()` is true (and on the server
 * returns `false` so SSR doesn't render the "hydrated" branch).
 */
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}