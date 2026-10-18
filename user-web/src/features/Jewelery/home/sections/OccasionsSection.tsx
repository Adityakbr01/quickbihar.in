import { useNavigate } from "react-router-dom";
import * as Haptics from "@/lib/haptics";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { occasions } from "@/src/features/Jewelery/data/collections";
import { SectionHeader } from "../components/SectionHeader";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Shop-by-occasion filter chips.
 * Extracted from JeweleryHomeScreen (`OccasionsSection`).
 * Preserves chip styling, haptics on tap, and search navigation destination.
 */
export function OccasionsSection() {
  const navigate = useNavigate();
  const colors = useColors();
  return (
    <div className="p-5" style={{ backgroundColor: colors.ivory }}>
      <SectionHeader label="FIND YOUR MOMENT" title="Shop by Occasion" />
      <div className="mt-4 flex flex-row flex-wrap gap-2">
        {occasions.map((o) => (
          <button
            key={o.id}
            type="button"
            className="flex cursor-pointer flex-row items-center gap-1.5 rounded-full border px-3 py-2 transition-colors active:opacity-80"
            style={{
              borderColor: colors.gold,
              borderWidth: 1,
              backgroundColor: "transparent",
            }}
            onClick={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              goTo(
                navigate,
                `/jewelery/search?query=${encodeURIComponent(o.label)}` as any,
              );
            }}
          >
            <o.icon size={13} color={colors.gold} />
            <span
              className="text-[13px]"
              style={{
                color: colors.ink,
                fontFamily: "CormorantGaramond_500Medium_Italic",
              }}
            >
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default OccasionsSection;
