import React from "react";

import { APP_CURRENCY } from "@/src/constants";
import { JEWELERY_MODULE_CONFIG } from "@/src/constants";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Top promotional announcement bar.
 * Extracted from JeweleryHomeScreen (`AnnouncementBar`).
 * Preserves exact colors, typography, and copy.
 */
export function AnnouncementBar() {
  const colors = useColors();
  const isDark = colors.isDark;

  // High-contrast emerald & gold luxury palette pairing
  const bg = isDark ? "#122A20" : colors.emerald;
  const textColor = isDark ? "#EAD7B5" : colors.champagne;

  return (
    <div
      className="flex items-center justify-center py-2"
      style={{ backgroundColor: bg }}
    >
      <span
        className="px-4 text-nowrap text-center text-[8px] tracking-[0.8px]"
        style={{ color: textColor, fontFamily: "DMSans_400Regular" }}
      >
        Free shipping above {APP_CURRENCY}
        {JEWELERY_MODULE_CONFIG.freeShippingThreshold.toLocaleString("en-IN")} ·
        Hallmarked gold · Try at home available
      </span>
    </div>
  );
}
