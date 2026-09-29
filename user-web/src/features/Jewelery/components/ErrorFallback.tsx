import { CircleAlert, X } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import { useSafeAreaInsets } from "@/src/hooks/useSafeAreaInsets";

import { useColors } from "@/src/features/Jewelery/hooks/useColors";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const isDev = import.meta.env.DEV;

  const handleRestart = async () => {
    try {
      window.location.reload();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
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

  const monoFont = "monospace";

  return (
    <div
      className="flex h-full w-full items-center justify-center p-6"
      style={{ backgroundColor: colors.background }}
    >
      {isDev ? (
        <button
          type="button"
          onClick={() => setIsModalVisible(true)}
          aria-label="View error details"
          className="absolute right-4 flex h-11 w-11 cursor-pointer flex-row items-center justify-center rounded-lg transition-opacity active:opacity-80"
          style={{
            top: insets.top + 16,
            backgroundColor: colors.card,
          }}
        >
          <CircleAlert size={20} color={colors.foreground} />
        </button>
      ) : null}

      <div className="flex w-full max-w-[600px] items-center justify-center gap-4">
        <div className="flex w-full flex-col items-center justify-center gap-4">
          <p
            className="text-center text-[28px] leading-10 font-bold"
            style={{ color: colors.foreground }}
          >
            Something went wrong
          </p>

          <p
            className="text-center text-base leading-6"
            style={{ color: colors.mutedForeground }}
          >
            Please reload the app to continue.
          </p>

          <button
            type="button"
            onClick={handleRestart}
            className="min-w-[200px] cursor-pointer rounded-lg px-6 py-4 shadow-md transition-all active:scale-[0.98] active:opacity-90"
            style={{ backgroundColor: colors.primary }}
          >
            <span
              className="text-center text-base font-semibold"
              style={{ color: colors.primaryForeground }}
            >
              Try Again
            </span>
          </button>
        </div>
      </div>

      {isDev && isModalVisible ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Error Details"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalVisible(false);
          }}
        >
          <div
            className="flex h-[90%] max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl"
            style={{ backgroundColor: colors.background }}
          >
            <div
              className="flex flex-row items-center justify-between border-b px-4 pt-4 pb-3"
              style={{ borderBottomColor: colors.border }}
            >
              <p
                className="text-xl font-semibold"
                style={{ color: colors.foreground }}
              >
                Error Details
              </p>
              <button
                type="button"
                onClick={() => setIsModalVisible(false)}
                aria-label="Close error details"
                className="flex h-11 w-11 cursor-pointer items-center justify-center transition-opacity active:opacity-60"
              >
                <X size={24} color={colors.foreground} />
              </button>
            </div>

            <div
              className="min-h-0 flex-1 overflow-auto p-4"
              style={{ paddingBottom: insets.bottom + 16 }}
            >
              <div
                className="w-full overflow-hidden rounded-lg p-4"
                style={{ backgroundColor: colors.card }}
              >
                <pre
                  className={cn("w-full text-xs leading-[18px] whitespace-pre-wrap break-words")}
                  style={{ color: colors.foreground, fontFamily: monoFont }}
                >
                  {formatErrorDetails()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
