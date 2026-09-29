import React from "react";
import { Star } from "lucide-react";

interface RatingBarProps {
  stars: number;
  count: number;
  total: number;
  theme: any;
}

export const RatingBar = ({ stars, count, total, theme }: RatingBarProps) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex flex-row items-center gap-1">
      <span className="w-3 text-right text-[11px] font-semibold" style={{ color: theme.secondaryText }}>
        {stars}
      </span>
      <Star size={10} color="#F59E0B" fill="#F59E0B" />
      <div className="h-[5px] flex-1 overflow-hidden rounded" style={{ backgroundColor: theme.border }}>
        <div
          className="h-full rounded"
          style={{
            width: `${pct}%`,
            backgroundColor:
              stars >= 4 ? "#34C759" : stars >= 3 ? "#F59E0B" : "#FF3B30",
          }}
        />
      </div>
      <span className="w-7 text-right text-[10px]" style={{ color: theme.tertiaryText }}>
        {count}
      </span>
    </div>
  );
};
