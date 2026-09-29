import React from "react";
import LazyLottie from "@/src/components/common/LazyLottie";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

import fireLottie from "@/assets/lottie/Fire.json";

interface TrendingSectionProps {
  trendingItems: string[];
  onSelect: (item: string) => void;
}

const TrendingSection = ({ trendingItems, onSelect }: TrendingSectionProps) => {
  const theme = useTheme();

  return (
    <div className="py-4">
      <div className="mb-3 flex flex-row items-center px-5">
        <span className="mr-1.5 flex h-6 w-6 items-center justify-center overflow-hidden">
          <LazyLottie
            key={theme.text}
            source={fireLottie}
            autoPlay
            loop
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        </span>
        <h2 className="text-lg font-semibold" style={{ color: theme.text }}>Trending Now</h2>
      </div>

      <div className="flex flex-row gap-2.5 overflow-x-auto px-5" style={{ scrollbarWidth: "none" }}>
        {trendingItems.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(item);
            }}
            className="shrink-0 cursor-pointer rounded-full border px-4 py-2"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
          >
            <span className="text-sm font-medium" style={{ color: theme.text }}>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingSection;
