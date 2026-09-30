import React from "react";
import { Gradient } from "@/src/components/common/Gradient";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import type { TopMall } from "../api/mall.api";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";

interface MallCardProps {
  mall: TopMall;
}

export const MallCard = ({ mall }: MallCardProps) => {
  const navigate = useNavigate();
  const theme = useTheme() as any;

  const mallTitle = mall.name || "Shopping Mall";
  const mallLoc = mall.location || "Bihar";

  return (
    <div
      role="link"
      tabIndex={0}
      title={`Explore ${mallTitle} stores and offers in ${mallLoc}`}
      onClick={() => goTo(navigate, `/mall/${mall.id || mall._id}` as any)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") goTo(navigate, `/mall/${mall.id || mall._id}` as any);
      }}
      className="relative h-[220px] w-full cursor-pointer overflow-hidden rounded-[20px] shadow-lg"
      style={{ backgroundColor: theme.background }}
    >
      <img
        src={mall.image}
        alt={`${mallTitle} - Shopping Mall in ${mallLoc}`}
        title={`${mallTitle} | QuickBihar Local Mall`}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
      />

      {/* Dynamic Rating Badge */}
      <div className="absolute top-3 right-3 flex flex-row items-center gap-1 rounded-xl bg-white/95 px-2 py-1">
        <Star size={12} color="#facc15" fill="#facc15" />
        <span className="text-xs font-bold text-black">{mall.rating}</span>
      </div>

      <Gradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60%",
          padding: 16,
          justifyContent: "flex-end",
        }}
      >
        <span className="mb-0.5 block truncate text-lg font-bold text-white">
          {mall.name}
        </span>
        <div className="flex flex-row items-center gap-1">
          <AppIcon icon={MapPin} size={12} color="rgba(255, 255, 255, 0.8)" />
          <span className="block truncate text-xs font-medium text-white/90">
            {mall.location}
          </span>
        </div>
      </Gradient>
    </div>
  );
};
