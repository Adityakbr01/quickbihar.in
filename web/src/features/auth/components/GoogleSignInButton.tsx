"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Google Sign-In button — custom-styled.
 *
 * Why this isn't just `<GoogleLogin />` from @react-oauth/google:
 *   That component renders the official Google iframe, which has a fixed
 *   design (G logo in a white circle, dark or white button chrome, etc.).
 *   On QuickBihar's dark auth pages the dark theme blends into the page
 *   background and the G circle looks like a floating element. The
 *   standard "white background, dark text" theme is the most recognizable
 *   and renders well on both light and dark surfaces.
 *
 * How we still get a real id_token:
 *   We load the Google Identity Services (GIS) SDK ourselves, render a
 *   visually-hidden GIS button, and programmatically click it when the
 *   user clicks our custom button. GIS handles the OAuth flow and calls
 *   our `callback` with the id_token JWT in `response.credential`. The
 *   parent then POSTs that to /auth/google — same as before.
 *
 * Brand rules we follow (per Google's Sign-In button guidelines):
 *   - Always show the multi-color G icon (never recolor it).
 *   - Always use one of the three official button texts.
 *   - Keep the icon + text together on the left.
 */

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: number;
      logo_alignment?: "left" | "center";
    },
  ) => void;
  prompt: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

interface GoogleSignInButtonProps {
  /** Called with the Google `idToken` (a JWT) when the popup resolves. */
  onSuccess: (idToken: string) => void;
  /** Called when the user closes the popup or Google rejects the request. */
  onError?: (message: string) => void;
  /** Optional override for the button label. */
  label?: string;
  /**
   * Visual variant. All variants use the standard white-background,
   * dark-text Google button style because that's the most recognizable
   * on QuickBihar's dark auth pages.
   *   - "white"          → default. Clean white card, dark text, dark border.
   *   - "blue"           → solid Google blue, white text.
   *   - "outline_on_dark"→ same as "white" (alias kept for API compat).
   */
  variant?: "white" | "blue" | "outline_on_dark";
  /** Stops click events from bubbling (e.g. when nested in a form). */
  disabled?: boolean;
}

// Map our label to one of Google's three official button texts.
const gsiTextFrom = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes("sign up")) return "signup_with" as const;
  if (lower.includes("continue")) return "continue_with" as const;
  return "signin_with" as const;
};

const GIS_SRC = "https://accounts.google.com/gsi/client";

export default function GoogleSignInButton({
  onSuccess,
  onError,
  label = "Continue with Google",
  variant = "white",
  disabled = false,
}: GoogleSignInButtonProps) {
  const gisMountRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  // We keep a ref to the most recent onSuccess/onError so the GIS init
  // effect doesn't re-run every time the parent re-renders.
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const [gsiReady, setGsiReady] = useState(
    typeof window !== "undefined" && Boolean(window.google?.accounts?.id),
  );
  const [busy, setBusy] = useState(false);

  // ── 1. Load the GIS SDK once per page ───────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.id) {
      setGsiReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => setGsiReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiReady(true);
    script.onerror = () =>
      onErrorRef.current?.("Could not load Google Sign-In. Check your network.");
    document.head.appendChild(script);
  }, []);

  // ── 2. Initialize GIS + render a hidden button ──────────────────────
  useEffect(() => {
    if (!gsiReady) return;
    if (initializedRef.current) return;
    if (!gisMountRef.current) return;
    if (!window.google?.accounts?.id) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes("placeholder")) {
      // Don't throw — the button will show a friendly error when clicked.
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        setBusy(false);
        if (response?.credential) {
          onSuccessRef.current(response.credential);
        } else {
          onErrorRef.current?.("Google sign-in did not return a credential.");
        }
      },
      cancel_on_tap_outside: true,
    });

    // Render a hidden icon-only GIS button. We click it programmatically
    // from our custom button so we get the real Google flow but our own UI.
    window.google.accounts.id.renderButton(gisMountRef.current, {
      type: "icon",
      theme: "outline",
      size: "large",
      shape: "rectangular",
    });

    initializedRef.current = true;
  }, [gsiReady]);

  // ── 3. Click handler — triggers the hidden GIS button ──────────────
  const handleClick = useCallback(() => {
    if (disabled || busy) return;

    if (!initializedRef.current) {
      onErrorRef.current?.(
        !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
          ? "Google Sign-In is not configured."
          : "Google Sign-In is still loading. Please try again in a moment.",
      );
      return;
    }

    setBusy(true);

    // GIS renders an inner div[role=button] inside our mount node. Click it.
    const gisButton = gisMountRef.current?.querySelector<HTMLElement>(
      'div[role="button"]',
    );
    if (gisButton) {
      gisButton.click();
    } else {
      setBusy(false);
      onErrorRef.current?.("Google Sign-In is not ready. Please try again.");
    }
  }, [disabled, busy]);

  // Reset busy if the GIS callback never fires (e.g. user closes popup
  // without signing in). GIS doesn't always fire onError for cancel, so
  // we use a small grace timeout as a safety net.
  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => setBusy(false), 60_000);
    return () => clearTimeout(t);
  }, [busy]);

  // ── Styles per variant ──────────────────────────────────────────────
  const variantStyles =
    variant === "blue"
      ? "bg-[#4285F4] hover:bg-[#3367D6] text-white border border-transparent shadow-sm"
      : "bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm";

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || busy}
        className={`w-full font-medium py-6 transition-all active:scale-[0.99] ${variantStyles}`}
      >
        {busy ? (
          <>
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <GoogleGIcon />
            <span className="ml-3">{label}</span>
          </>
        )}
      </Button>

      {/*
        Hidden GIS button. We render an icon-only button and click it
        programmatically. The mount node needs to be in the DOM (even if
        off-screen) for GIS to attach the iframe.
      */}
      <div
        ref={gisMountRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />
    </>
  );
}

/**
 * The multi-color Google "G" icon. We inline the SVG so we never need
 * to load an extra image and so the colors are guaranteed to match the
 * official brand palette.
 */
function GoogleGIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
