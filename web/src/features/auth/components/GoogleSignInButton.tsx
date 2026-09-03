"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleSignInButtonProps {
  /**
   * Called with the Google `idToken` (a JWT) when the popup resolves.
   * The parent is responsible for POSTing it to `/auth/google`.
   */
  onSuccess: (idToken: string) => void;
  /** Called when the user closes the popup or Google rejects the request. */
  onError?: (message: string) => void;
  /** Optional override for the button label. */
  label?: string;
  /** Color theme — defaults to "outline_on_dark" since auth pages are dark. */
  variant?: "blue" | "white" | "outline_on_dark";
  /** Stops click events from bubbling (e.g. when nested in a form). */
  disabled?: boolean;
}

/**
 * Renders a Google-branded sign-in button that uses the OAuth 2.0 implicit
 * flow. The returned credential is an `idToken` JWT that the server verifies
 * with `google-auth-library`. We deliberately use the implicit flow (token
 * type `id_token`) instead of `code` to keep parity with the mobile client
 * and to avoid a server-side redirect-URI round-trip on the web.
 */
export default function GoogleSignInButton({
  onSuccess,
  onError,
  label = "Continue with Google",
  variant = "outline_on_dark",
  disabled = false,
}: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);

  const trigger = useGoogleLogin({
    // We request an id_token, not an auth code, so the server gets a JWT
    // it can verify directly with google-auth-library.
    flow: "implicit",
    onSuccess: (tokenResponse) => {
      setBusy(false);
      // The implicit-flow `id_token` field is missing from the public
      // @react-oauth/google TokenResponse type but IS present at runtime
      // (it's the whole point of the implicit flow). Cast to access it.
      const idToken = (tokenResponse as unknown as { id_token?: string })?.id_token;
      if (tokenResponse?.access_token && !idToken) {
        // Defensive: if the library returns only an access token, prompt the
        // user. We can't exchange an access token for an id_token client-side.
        onError?.(
          "Google sign-in returned an access token instead of an ID token. Please contact support.",
        );
        return;
      }
      if (idToken) {
        onSuccess(idToken);
      } else {
        onError?.("Google sign-in did not return a token.");
      }
    },
    onError: (error) => {
      setBusy(false);
      onError?.(
        error?.error_description ||
          error?.error ||
          "Google sign-in was cancelled.",
      );
    },
  });

  const handleClick = () => {
    if (disabled || busy) return;
    setBusy(true);
    try {
      trigger();
    } catch (e: any) {
      setBusy(false);
      onError?.(e?.message || "Google sign-in failed to start.");
    }
  };

  const className =
    variant === "blue"
      ? "w-full bg-[#4285F4] hover:bg-[#3367D6] text-white font-semibold py-6 transition-all"
      : variant === "white"
        ? "w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-6 transition-all"
        : "w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold py-6 transition-all";

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      className={className}
    >
      {busy ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in…
        </>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <GoogleGLogo />
          {label}
        </span>
      )}
    </Button>
  );
}

/** Inline SVG of the official Google "G" logo. */
function GoogleGLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-5 w-5 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
