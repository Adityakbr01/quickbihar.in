import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated";

const AUTH_STORAGE_KEY = "admin-auth-storage";

/**
 * Client-side replacement for the old Next.js `proxy.ts` route guard.
 *
 * A Vite SPA has no server middleware, so the httpOnly `accessToken` cookie
 * can't be inspected before serving HTML. Instead we use the zustand
 * persisted token in localStorage as the *presence* signal — the same source
 * the axios request interceptor reads. The JWT `exp` check below mirrors
 * `isTokenValid()` from the old proxy.
 *
 * This is a UX/defense-in-depth layer, NOT the security boundary — per-role
 * authorization stays enforced by backend RBAC on every `/api` call (and the
 * axios 401/403 interceptor still owns session-expiry redirects).
 */
export function readStoredToken(): string | null {
  try {
    const persisted = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!persisted) return null;
    return JSON.parse(persisted)?.state?.token || null;
  } catch {
    return null;
  }
}

export function isTokenValid(token?: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (payload.exp && typeof payload.exp === "number") {
      if (payload.exp * 1000 <= Date.now() + 5000) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function useStoredSession() {
  const hasHydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const authed = hasHydrated && isAuthenticated && isTokenValid(token || readStoredToken());
  return { hasHydrated, authed };
}

/** Bounce unauthenticated visitors of a protected dashboard to its login. */
export function ProtectedRoute({
  loginTo,
  children,
}: {
  loginTo: string;
  children: ReactNode;
}) {
  const { hasHydrated, authed } = useStoredSession();
  if (!hasHydrated || !authed) {
    if (!hasHydrated) return <div className="min-h-screen bg-background" />;
    return <Navigate to={loginTo} replace />;
  }
  return <>{children}</>;
}

/**
 * Keep authenticated users off login pages (bounce to their dashboard).
 * Mirrors the old proxy LOGIN_ROUTES rule, including the `?expired` /
 * `?logout` / `?force` escape hatch that forces the login form to render
 * (and wipes the stale local token) instead of bouncing back.
 */
export function GuestRoute({
  dashboardTo,
  children,
}: {
  dashboardTo: string;
  children: ReactNode;
}) {
  const { hasHydrated, authed } = useStoredSession();
  const { search, pathname } = useLocation();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const params = new URLSearchParams(search);
  const forceLogin =
    params.has("expired") || params.has("logout") || params.has("force");

  useEffect(() => {
    if (hasHydrated && forceLogin) {
      try {
        clearAuth();
      } catch {}
    }
  }, [hasHydrated, forceLogin, clearAuth]);

  if (!hasHydrated) return <>{children}</>;
  if (authed && !forceLogin) return <Navigate to={dashboardTo} replace />;
  void pathname;
  return <>{children}</>;
}

/** Scroll to top on every route change (Next.js did this by default). */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Mark portal/auth routes noindex (replaces per-layout Next metadata). */
export function NoIndex({ children }: { children: ReactNode }) {
  useEffect(() => {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !tag;
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "robots";
      document.head.appendChild(tag);
    }
    const prev = tag.content;
    tag.content = "noindex, nofollow";
    document.title = document.title || "QuickBihar Dashboard";
    return () => {
      if (created) tag?.remove();
      else if (tag) tag.content = prev;
    };
  }, []);
  return <>{children}</>;
}
