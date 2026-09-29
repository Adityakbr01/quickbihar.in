import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useWindowWidth } from "@/src/utils/responsive";

// Pulsing placeholder mirroring the 2-column wishlist card
// (image block + brand / title / price lines).
export const WishlistCardSkeleton = () => {
  const theme = useTheme() as any;
  const windowWidth = useWindowWidth();
  const columnWidth = (windowWidth - 48) / 2;

  return (
    <div
      className="mb-5 animate-pulse overflow-hidden rounded-xl border"
      style={{
        width: columnWidth,
        borderColor: theme.border,
        backgroundColor: theme.background,
      }}
    >
      <div
        className="w-full rounded-xl"
        style={{ height: columnWidth * 1.3, backgroundColor: theme.tertiaryBackground }}
      />
      <div className="p-2.5">
        <div
          className="h-[11px] w-[45%] rounded"
          style={{ backgroundColor: theme.tertiaryBackground }}
        />
        <div
          className="mt-1.5 h-[13px] w-full rounded"
          style={{ backgroundColor: theme.tertiaryBackground }}
        />
        <div className="mt-2 flex flex-row items-center gap-1.5">
          <div
            className="h-4 w-[70px] rounded"
            style={{ backgroundColor: theme.tertiaryBackground }}
          />
          <div
            className="h-3 w-[45px] rounded"
            style={{ backgroundColor: theme.tertiaryBackground }}
          />
        </div>
      </div>
    </div>
  );
};
