import React from "react";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

interface SectionHeaderProps {
  label?: string;
  title: string;
  onSeeAll?: () => void;
}

/**
 * Reusable section heading used by every Jewellery home section.
 * Extracted from JeweleryHomeScreen (`SectionHeader`).
 * Preserves exact label/title styling and the "See all" link behavior.
 */
export function SectionHeader({
  label,
  title,
  onSeeAll,
}: SectionHeaderProps) {
  const colors = useColors();
  return (
    <div className="flex flex-row items-end justify-between">
      <div>
        {label && (
          <span
            className="mb-1 block text-[9px] tracking-[2px]"
            style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
          >
            {label}
          </span>
        )}
        <h2
          className="text-[26px] leading-[30px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_500Medium_Italic",
          }}
        >
          {title}
        </h2>
      </div>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll} className="cursor-pointer">
          <span
            className="text-[11px] tracking-[0.5px]"
            style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
          >
            See all
          </span>
        </button>
      )}
    </div>
  );
}
