"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

/**
 * Wraps the app with the GoogleOAuthProvider so any child can render the
 * official <GoogleLogin /> button. The web OAuth client ID is read from
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID; if it's missing we fall back to a placeholder
 * so dev builds don't crash — the actual Google sign-in will simply refuse to
 * start until a real client ID is set.
 */
const clientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  // Placeholder so the provider doesn't throw on dev machines that haven't
  // configured a client ID yet. Real Google sign-in won't work with this value.
  "placeholder-google-client-id.apps.googleusercontent.com";

export default function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
