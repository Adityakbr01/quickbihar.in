import { useNavigate } from "react-router-dom";
import * as Haptics from "@/lib/haptics";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Brand heritage / craft story section.
 * Extracted from JeweleryHomeScreen (`HeritageSection`).
 * Preserves copy, colors, typography, and the "Explore Our Craft" navigation.
 */
export function HeritageSection() {
  const navigate = useNavigate();
  const colors = useColors();
  return (
    <div style={{ backgroundColor: colors.pearl }}>
      <div className="flex flex-col gap-3 p-6">
        <span
          className="text-[9px] tracking-[2px]"
          style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
        >
          OUR CRAFT
        </span>
        <h2
          className="text-[26px] leading-[32px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_400Regular_Italic",
          }}
        >
          Every piece holds the memory of hands that shaped it.
        </h2>
        <p
          className="text-[13px] leading-[22px]"
          style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
        >
          We work with master karigar families across Jaipur, Thrissur, and
          Banarasi ateliers — artisans whose craft has been passed down for
          generations.
          <br />
          <br />
          Our jewellery is not manufactured. It is made.
        </p>
        <button
          type="button"
          className="cursor-pointer self-start"
          onClick={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goTo(navigate, "/jewelery/collections" as any);
          }}
        >
          <span
            className="text-xs tracking-[1px]"
            style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
          >
            Explore Our Craft →
          </span>
        </button>
      </div>
    </div>
  );
}

export default HeritageSection;
