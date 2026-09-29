import { RefreshCw, TriangleAlert, X } from "lucide-react";
import React, { useState } from "react";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

// Neutral palette — no dependency on any vertical's useColors().
const neutral = {
  bg: "#FFFFFF",
  card: "#F5F5F5",
  border: "#E0E0E0",
  text: "#1A1A1A",
  subtext: "#6B6B6B",
  primary: "#1A1A1A",
  danger: "#D32F2F",
};

/**
 * Generic error fallback UI with restart + try-again actions.
 *
 * ponytail: moved from Jewelery/components/ErrorFallback.tsx and made
 * theme-agnostic so any vertical can use it without pulling in Jewelery's
 * useColors() hook. Pass a custom FallbackComponent to ErrorBoundary if you
 * need themed colours.
 */
export function CommonErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      window.location.reload();
    } catch {
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-6"
      style={{ backgroundColor: neutral.bg, paddingTop: 24, paddingBottom: 24 }}
    >
      <div className="mb-5">
        <div
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full"
          style={{ backgroundColor: neutral.card }}
        >
          <TriangleAlert size={32} color={neutral.danger} />
        </div>
      </div>

      <h2 className="mb-2 text-center text-[22px] font-bold" style={{ color: neutral.text }}>
        Something went wrong
      </h2>
      <p className="mb-8 text-center text-sm leading-5" style={{ color: neutral.subtext }}>
        {error.message || "An unexpected error occurred."}
      </p>

      <div className="flex w-full flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleRestart}
          className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-lg py-3.5"
          style={{ backgroundColor: neutral.primary }}
        >
          <RefreshCw size={14} color="#fff" />
          <span className="text-[15px] font-semibold text-white">Restart App</span>
        </button>

        <button
          type="button"
          onClick={resetError}
          className="w-full cursor-pointer rounded-lg border py-3"
          style={{ borderColor: neutral.border }}
        >
          <span className="text-[15px] font-medium" style={{ color: neutral.text }}>
            Try Again
          </span>
        </button>

        <button type="button" onClick={() => setIsModalVisible(true)} className="mt-1 cursor-pointer">
          <span className="text-xs underline" style={{ color: neutral.subtext }}>
            View error details
          </span>
        </button>
      </div>

      {isModalVisible ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Error details"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalVisible(false);
          }}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl p-5 sm:rounded-3xl"
            style={{ backgroundColor: neutral.bg }}
          >
            <div className="mb-4 flex flex-row items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: neutral.text }}>
                Error Details
              </h3>
              <button
                type="button"
                onClick={() => setIsModalVisible(false)}
                aria-label="Close error details"
                className="cursor-pointer p-1"
              >
                <X size={22} color={neutral.text} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <pre
                className="rounded-lg border p-4 text-[11px] leading-[18px] whitespace-pre-wrap"
                style={{ color: neutral.subtext, backgroundColor: neutral.card, borderColor: neutral.border, fontFamily: "monospace" }}
              >
                {formatErrorDetails()}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
