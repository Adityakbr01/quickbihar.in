import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Festive campaign banner.
 * Extracted from JeweleryHomeScreen (`FestiveCampaign`).
 * Preserves copy, colors, typography, and navigation destination.
 */
export function FestiveCampaign() {
  const navigate = useNavigate();
  const colors = useColors();
  return (
    <div
      className="flex flex-col items-center gap-3.5 p-8"
      style={{ backgroundColor: colors.emerald }}
    >
      <span
        className="text-base"
        style={{
          color: colors.gold,
          fontFamily: "CormorantGaramond_400Regular_Italic",
        }}
      >
        This festive season —
      </span>
      <h2
        className="text-center text-[36px] leading-[42px]"
        style={{
          color: "#F7F3EC",
          fontFamily: "CormorantGaramond_300Light_Italic",
        }}
      >
        Adorn yourself in your own story.
      </h2>
      <p
        className="text-center text-[13px] leading-5"
        style={{
          color: "rgba(247,243,236,0.7)",
          fontFamily: "DMSans_300Light",
        }}
      >
        Curated festive edits in gold, kundan, and polki. New drops every
        fortnight. Gifting boxes available.
      </p>
      <button
        type="button"
        className="mt-1.5 cursor-pointer rounded-[1px] px-7 py-3.5 transition-opacity active:opacity-90"
        style={{ backgroundColor: colors.gold }}
        onClick={() => goTo(navigate, "/jewelery/collections" as any)}
      >
        <span
          className="text-xs tracking-[1.5px]"
          style={{ color: colors.onBrand, fontFamily: "DMSans_500Medium" }}
        >
          Shop Festive Edit
        </span>
      </button>
    </div>
  );
}

export default FestiveCampaign;
