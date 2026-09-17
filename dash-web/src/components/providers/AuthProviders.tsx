import { ReactNode } from "react";

/**
 * Provider wrapper for auth-related setup.
 *
 * Previously this wrapped children in `GoogleOAuthProvider` from
 * `@react-oauth/google` so the official `<GoogleLogin />` iframe could
 * be rendered. We now use the Google Identity Services SDK directly
 * (loaded on demand by `GoogleSignInButton`), so no provider is needed.
 *
 * Kept as a component so any future client-side auth providers (Sentry,
 * PostHog, etc.) can be added here without touching the root layout.
 */
export default function AuthProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
