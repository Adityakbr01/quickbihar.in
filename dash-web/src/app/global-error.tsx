"use client";

/**
 * Root error boundary for the entire app — kicks in if even `app/layout.tsx`
 * throws (which would otherwise leave the user on a totally blank page).
 * Next.js requires this file to include its own <html>/<body> since the
 * root layout is presumed broken.
 */

import { AlertTriangle, RefreshCcw } from "lucide-react";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalRootError({ error, reset }: RootErrorProps) {
  // eslint-disable-next-line no-console
  console.error("[GlobalRootError]", error);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#0e0e0e",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              background: "#181818",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 32,
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                height: 56,
                width: 56,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={28} color="#f87171" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
              QuickBihar hit an unexpected error
            </h1>
            <p style={{ color: "#9ca3af", marginTop: 8, fontSize: 14 }}>
              {error?.message ||
                "The application failed to start. Please reload the page."}
            </p>
            {error?.digest && (
              <p
                style={{
                  color: "#6b7280",
                  fontSize: 10,
                  fontFamily: "monospace",
                  marginTop: 8,
                  wordBreak: "break-all",
                }}
              >
                ref: {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                reset();
                if (typeof window !== "undefined") window.location.reload();
              }}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "12px 16px",
                background: "white",
                color: "black",
                border: 0,
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <RefreshCcw size={16} />
              Reload the app
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
