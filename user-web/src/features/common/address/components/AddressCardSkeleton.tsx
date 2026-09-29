import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

// Pulsing placeholder mirroring the address card layout
// (type badge row, name / phone / address lines, actions row).
export const AddressCardSkeleton = () => {
  const theme = useTheme() as any;

  return (
    <div
      className="mb-3 animate-pulse rounded-2xl border p-4"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.tertiaryBackground,
      }}
    >
      <div className="mb-3 flex flex-row items-center justify-between">
        <div
          className="h-6 w-[84px] rounded-lg"
          style={{ backgroundColor: theme.border }}
        />
        <div
          className="h-[22px] w-[70px] rounded-md"
          style={{ backgroundColor: theme.border }}
        />
      </div>

      <div
        className="h-[18px] w-[55%] rounded"
        style={{ backgroundColor: theme.border }}
      />
      <div
        className="mt-2 h-3.5 w-[40%] rounded"
        style={{ backgroundColor: theme.border }}
      />
      <div
        className="mt-3 h-3.5 w-full rounded"
        style={{ backgroundColor: theme.border }}
      />
      <div
        className="mt-1.5 h-3.5 w-[75%] rounded"
        style={{ backgroundColor: theme.border }}
      />

      <div
        className="mt-3.5 flex flex-row gap-3 border-t pt-3.5"
        style={{ borderTopColor: theme.border }}
      >
        <div
          className="h-9 w-[110px] rounded-[10px]"
          style={{ backgroundColor: theme.border }}
        />
        <div
          className="h-9 w-[110px] rounded-[10px]"
          style={{ backgroundColor: theme.border }}
        />
      </div>
    </div>
  );
};
