import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side route guard (Next.js 16 "proxy", formerly middleware).
 *
 * The app is served single-origin behind nginx (`/api/` and `/web/` share a
 * host), so the httpOnly `accessToken` cookie the API sets on login is visible
 * here. We use it only as a *presence* signal:
 *
 *   - hitting a protected dashboard without the cookie  -> bounce to that
 *     portal's login (no dashboard shell/JS for anonymous visitors).
 *   - hitting a login page while already carrying the cookie -> bounce to the
 *     dashboard (don't show login to an authenticated user).
 *
 * This is a UX/defense-in-depth layer, NOT the security boundary. The access
 * token's JWT payload carries no role claim (`{ _id, email, username,
 * fullName }`), so per-role authorization is intentionally NOT done here — it
 * stays enforced by the backend RBAC on every `/api` call (and mirrored by the
 * client-side role guards for redirects). A present-but-expired/forged cookie
 * still reaches the dashboard, where the API will reject it and the axios
 * refresh/again-401 flow logs the user out.
 */

const ACCESS_COOKIE = "accessToken";

// Each portal's protected root -> where to send an unauthenticated visitor.
const PROTECTED: Array<{ prefix: string; login: string }> = [
  { prefix: "/admin/dashboard", login: "/admin/login" },
  { prefix: "/seller/dashboard", login: "/seller/login" },
  { prefix: "/delivery/dashboard", login: "/delivery/login" },
];

// Login pages -> where to send an already-authenticated visitor.
const LOGIN_ROUTES: Array<{ prefix: string; dashboard: string }> = [
  { prefix: "/admin/login", dashboard: "/admin/dashboard" },
  { prefix: "/seller/login", dashboard: "/seller/dashboard" },
  { prefix: "/delivery/login", dashboard: "/delivery/dashboard" },
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has(ACCESS_COOKIE);

  const protectedMatch = PROTECTED.find((route) =>
    pathname.startsWith(route.prefix),
  );
  if (protectedMatch && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = protectedMatch.login;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const loginMatch = LOGIN_ROUTES.find((route) =>
    pathname.startsWith(route.prefix),
  );
  if (loginMatch && hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = loginMatch.dashboard;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only the auth-relevant portal routes; everything else (landing, _next,
  // api, static) is skipped so the proxy stays cheap.
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/delivery/:path*",
  ],
};
