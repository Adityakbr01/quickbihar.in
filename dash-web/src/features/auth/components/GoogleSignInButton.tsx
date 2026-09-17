import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Google Sign-In button — official Google Identity Services (GIS) rendering.
 *
 * Why this uses `renderButton` directly:
 *   Google's modern Identity Services SDK renders an iframe containing the sign-in button.
 *   Browsers and Google's security model strictly forbid synthetic/programmatic clicks
 *   on cross-origin iframes (to prevent clickjacking).
 *
 *   By rendering the standard button directly into our mount node, the user clicks Google's
 *   official interactive button directly. This guarantees the OAuth popup opens without
 *   browser popup-blocker issues or iframe security errors.
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
   * Visual variant.
   *   - "white"           → outline theme (white card, dark text).
   *   - "blue"            → filled_blue theme (solid Google blue).
   *   - "outline_on_dark" → outline theme.
   */
  variant?: "white" | "blue" | "outline_on_dark";
  /** Stops click events / interaction when busy or parent is disabled. */
  disabled?: boolean;
}

// Map label to one of Google's official button texts.
const gsiTextFrom = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes("sign up") || lower.includes("register")) return "signup_with" as const;
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
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const [gsiReady, setGsiReady] = useState(
    typeof window !== "undefined" && Boolean(window.google?.accounts?.id),
  );
  const [busy, setBusy] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [clientId, setClientId] = useState<string | null>(
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
      !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes("placeholder")
      ? import.meta.env.VITE_GOOGLE_CLIENT_ID
      : null,
  );

  // Fallback: If NEXT_PUBLIC_GOOGLE_CLIENT_ID wasn't baked in at build time,
  // fetch it dynamically from the server's public auth config endpoint.
  useEffect(() => {
    if (clientId) return;

    const controller = new AbortController();
    fetch("/api/v1/auth/config", { signal: controller.signal })
      .then((res) => res.json())
      .then((payload) => {
        const id = payload?.data?.googleClientId;
        if (id && typeof id === "string" && !id.includes("placeholder")) {
          setClientId(id);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [clientId]);

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

  // ── 2. Initialize GIS + render official Google button directly into mount ──
  useEffect(() => {
    if (!gsiReady || !clientId || !gisMountRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
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

      // Clear any prior children in the mount node
      gisMountRef.current.innerHTML = "";

      // Calculate width to fit the container up to Google's 400px limit
      const containerWidth = gisMountRef.current.clientWidth || 380;
      const buttonWidth = Math.min(Math.max(containerWidth, 240), 400);

      window.google.accounts.id.renderButton(gisMountRef.current, {
        type: "standard",
        theme: variant === "blue" ? "filled_blue" : "outline",
        size: "large",
        text: gsiTextFrom(label),
        shape: "rectangular",
        width: buttonWidth,
        logo_alignment: "left",
      });

      setRendered(true);
    } catch (err) {
      console.error("[GoogleSignInButton] Failed to initialize GIS button:", err);
      onErrorRef.current?.("Failed to initialize Google Sign-In.");
    }
  }, [gsiReady, clientId, variant, label]);

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      {/* Google Identity Services Mount Point */}
      <div
        ref={gisMountRef}
        className={`w-full flex justify-center [&>div]:w-full [&_iframe]:!w-full [&_iframe]:!max-w-full ${
          !rendered || busy ? "opacity-0 absolute pointer-events-none" : "opacity-100 relative"
        }`}
        style={{ minHeight: "44px" }}
      />

      {/* Fallback / Loading / Busy Skeleton */}
      {(!rendered || busy) && (
        <div
          className="w-full flex items-center justify-center h-[44px] rounded-xl bg-card text-card-foreground border border-border font-medium text-sm shadow-xs transition-all select-none"
          style={{ minHeight: "44px" }}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <img
              src="/google-icon-logo.svg"
              alt="Google"
              className="mr-2.5 h-4 w-4"
            />
          )}
          <span>
            {busy
              ? "Signing in with Google..."
              : !clientId
              ? "Configuring Google Sign-In..."
              : label || "Continue with Google"}
          </span>
        </div>
      )}

      {/* Disabled overlay mask if parent marks it disabled */}
      {disabled && rendered && !busy && (
        <div className="absolute inset-0 bg-background/50 cursor-not-allowed rounded-xl z-10" />
      )}
    </div>
  );
}
