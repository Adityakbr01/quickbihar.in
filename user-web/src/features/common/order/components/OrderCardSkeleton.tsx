import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

 // Pulsing placeholder that mirrors the order card layout (header row,
// items strip, footer row) so loading feels instant instead of a spinner.
export const OrderCardSkeleton = () => {
  const theme = useTheme() as any;

  return (
    <div
      className="animate-pulse rounded-2xl border p-3.5"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.tertiaryBackground,
        marginBottom: 10,
      }}
    >
      {/* Header: order id + date | status badge */}
      <div className="mb-3 flex flex-row items-start justify-between gap-2">
        <div className="flex-1">
          <div
            className="h-4 rounded"
            style={{ width: "55%", backgroundColor: theme.border }}
          />
          <div
            className="h-3 rounded"
            style={{
              width: "35%",
              backgroundColor: theme.border,
              marginTop: 6,
            }}
          />
        </div>
        <div
          className="h-[26px] w-[76px] rounded-lg"
          style={{ backgroundColor: theme.border }}
        />
      </div>

      {/* Items preview strip */}
      <div
        className="mb-3 flex flex-row items-center gap-2.5 rounded-xl border p-2.5"
        style={{
          backgroundColor: theme.background,
          borderColor: theme.border,
        }}
      >
        <div
          className="h-11 w-11 rounded-xl"
          style={{ backgroundColor: theme.border }}
        />
        <div className="flex-1">
          <div
            className="h-[13px] rounded"
            style={{ width: "80%", backgroundColor: theme.border }}
          />
        </div>
        <div
          className="h-9 w-9 rounded-full"
          style={{ backgroundColor: theme.border }}
        />
      </div>

      {/* Footer: total | details button */}
      <div
        className="flex flex-row items-center justify-between border-t pt-3"
        style={{ borderTopColor: theme.border }}
      >
        <div>
          <div
            className="h-[11px] w-[70px] rounded"
            style={{ backgroundColor: theme.border }}
          />
          <div
            className="h-[18px] w-[90px] rounded"
            style={{ backgroundColor: theme.border, marginTop: 6 }}
          />
        </div>
        <div
          className="h-9 w-[92px] rounded-full"
          style={{ backgroundColor: theme.border }}
        />
      </div>
    </div>
  );
};
