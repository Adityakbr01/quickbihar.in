import { Award, House, RefreshCw, Wrench } from "lucide-react";
import React from "react";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Trust / brand-pillar row displayed below the header.
 * Extracted from JeweleryHomeScreen (`BrandPillars`).
 * Preserves icons, labels, colors, borders, and typography.
 */
export function BrandPillars() {
  const colors = useColors();
  const pillars = [
    { icon: Award, label: "Hallmark\nCertified" },
    { icon: Wrench, label: "Handcrafted\nin India" },
    { icon: RefreshCw, label: "Free Returns\n30 Days" },
    { icon: House, label: "Try Before\nYou Buy" },
  ];

  return (
    <div
      className="flex flex-row border-y px-3 py-4"
      style={{
        backgroundColor: colors.ivory,
        borderTopColor: colors.gold,
        borderBottomColor: colors.gold,
        borderTopWidth: 1,
        borderBottomWidth: 1,
      }}
    >
      {pillars.map((p) => (
        <div
          key={p.label}
          className="flex flex-1 flex-col items-center gap-1.5"
        >
          <p.icon size={16} color={colors.gold} />
          <span
            className="whitespace-pre-line text-center text-[9px] leading-[13px] tracking-[0.5px]"
            style={{ color: colors.ink, fontFamily: "DMSans_400Regular" }}
          >
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default BrandPillars;
