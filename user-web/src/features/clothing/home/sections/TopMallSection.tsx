import React, { useRef } from "react";
import { BREAKPOINTS, DESKTOP, useWindowWidth } from "@/src/utils/responsive";
import LazyLottie from "@/src/components/common/LazyLottie";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { MallCardSkeleton } from "../components/MallCardSkeleton";
import { MallCard } from "../components/MallCard";
import { getTopMallsRequest } from "../api/mall.api";

const fireLottie = "/lottie/Fire.json";

const TopMallSection = () => {
  const theme = useTheme() as any;
  const windowWidth = useWindowWidth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isDesktop = windowWidth >= BREAKPOINTS.desktopMin;
  const isWebMobile = windowWidth > 600;
  const gap = isDesktop ? 20 : 16;
  // Mobile widths stay 260 but shrink on very small phones / foldables
  // so the card + 16px list padding never overflow.
  const mobileCardWidth = Math.min(260, Math.max(windowWidth - 64, 200));
  const webMobileCardWidth = Math.min(300, Math.max(windowWidth - 64, 200));
  // Mobile widths byte-identical. Desktop uses a 3-col grid cell.
  const desktopContainer = Math.min(
    windowWidth - DESKTOP.gutter * 2,
    DESKTOP.maxWidth,
  );
  const desktopCardWidth = (desktopContainer - gap * 2) / 3;
  const cardWidth = isDesktop
    ? desktopCardWidth
    : isWebMobile
      ? webMobileCardWidth
      : mobileCardWidth;
  const { data: topMalls, isLoading } = useQuery({
    queryKey: ["topMalls"],
    queryFn: getTopMallsRequest,
  });

  if (isLoading) {
    return (
      <section className="mt-6 py-5">
        <div className="flex flex-row gap-4 overflow-hidden px-4 pb-2">
          {[1, 2, 3].map((key) => (
            <div key={key} className="shrink-0" style={{ width: cardWidth }}>
              <MallCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const malls = topMalls || [];
  // Never promise "Top 10" with fewer than 10 malls — dynamic, honest heading. (todo fix that in future)
  const heading = "Top 10 Malls";

  if (!malls.length) {
    return null;
  }

  return (
    <section className="mt-6">
      <div className="mb-6 flex flex-row items-center justify-between px-5">
        <div className="flex flex-row items-center">
          <h2
            className="text-[22px] font-extrabold tracking-tight"
            style={{ color: theme.text }}
          >
            {heading}{" "}
          </h2>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
            <LazyLottie
              source={fireLottie}
              autoPlay
              loop
              resizeMode="contain"
              // NOTE: fire keeps its original colors in every theme —
              // no invert filter here (it would turn the flame blue).
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
        <button
          type="button"
          aria-label="Explore all malls"
          title="Explore top shopping malls and stores in Bihar"
          onClick={() => goTo(navigate, "/mall" as any)}
          className="cursor-pointer p-1 text-sm font-semibold"
          style={{ color: theme.iconColor }}
        >
          Explore All
        </button>
      </div>

      {isDesktop ? (
        <div
          className="flex flex-row flex-wrap gap-5"
          style={{ paddingLeft: 0, paddingRight: 0, rowGap: gap }}
        >
          {malls.slice(0, 6).map((item: any) => (
            <div
              key={item.id}
              className="shrink-0"
              style={{ width: cardWidth }}
            >
              <MallCard mall={item} />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex flex-row overflow-x-auto px-4 pb-2"
          style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
        >
          {malls.map((item: any, index: number) => (
            <div
              key={item.id}
              className="shrink-0"
              style={{
                width: cardWidth,
                marginRight: index === malls.length - 1 ? 0 : gap,
                scrollSnapAlign: "start",
              }}
            >
              <MallCard mall={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TopMallSection;
