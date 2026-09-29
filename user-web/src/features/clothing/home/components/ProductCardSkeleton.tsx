import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

export const ProductCardSkeleton = () => {
  const theme = useTheme() as any;

  return (
    <div
      className="w-full animate-pulse overflow-hidden rounded-2xl border"
      style={{ borderColor: theme.border, backgroundColor: theme.background }}
    >
      <div className="h-[200px] w-full" style={{ backgroundColor: theme.border }} />
      <div className="p-3">
        <div className="h-3.5 w-15 rounded" style={{ backgroundColor: theme.border }} />
        <div className="mt-2">
          <div className="h-4 w-full rounded" style={{ backgroundColor: theme.border }} />
          <div className="mt-1 h-4 w-[70%] rounded" style={{ backgroundColor: theme.border }} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-5 w-20 rounded" style={{ backgroundColor: theme.border }} />
          <div className="h-4 w-12.5 rounded" style={{ backgroundColor: theme.border }} />
        </div>
      </div>
    </div>
  );
};
