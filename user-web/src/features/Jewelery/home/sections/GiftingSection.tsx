import { useNavigate } from "react-router-dom";
import * as Haptics from "@/lib/haptics";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { APP_NAME } from "@/src/constants";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Gifting promotional section.
 * Extracted from JeweleryHomeScreen (`GiftingSection`).
 * Preserves copy, colors, typography, haptics, and navigation.
 */
export function GiftingSection() {
  const navigate = useNavigate();
  const colors = useColors();
  return (
    <div
      className="flex flex-col gap-4 p-5"
      style={{ backgroundColor: colors.champagne }}
    >
      <span
        className="text-[9px] tracking-[2px]"
        style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
      >
        GIVE SOMETHING FOREVER
      </span>
      <h2
        className="text-[26px] leading-[32px]"
        style={{
          color: colors.ink,
          fontFamily: "CormorantGaramond_500Medium_Italic",
        }}
      >
        Because some gifts outlive the occasion.
      </h2>
      <p
        className="text-[13px] leading-[22px]"
        style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
      >
        Every {APP_NAME} order ships in our signature ivory and gold gift box —
        complimentary. Add a handwritten note. Make it unforgettable.
      </p>
      <button
        type="button"
        className="cursor-pointer self-start rounded-[1px] border px-5 py-3 transition-colors active:opacity-80"
        style={{
          borderColor: colors.gold,
          borderWidth: 1,
          backgroundColor: "transparent",
        }}
        onClick={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          goTo(navigate, "/jewelery/collections" as any);
        }}
      >
        <span
          className="text-xs tracking-[1px]"
          style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
        >
          Explore Gifting →
        </span>
      </button>
    </div>
  );
}

export default GiftingSection;
