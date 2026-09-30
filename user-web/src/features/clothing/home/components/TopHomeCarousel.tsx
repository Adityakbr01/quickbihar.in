import React, { useState } from "react";
import { useWindowWidth, BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";
import Carousel from "@/src/components/common/EmblaCarousel";

import { useBanners } from "@/src/features/common/banner/hooks/useBanners";
import { Banner } from "@/src/features/common/banner/types/banner.types";
import DashIndicator from "./carousel/DashIndicator";
import CarouselSlide from "./carousel/CarouselSlide";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

const MAX_WIDTH = 800;

const TopHomeCarousel = ({ placement = "home_top" }: { placement?: string } = {}) => {
  const windowWidth = useWindowWidth();
  const theme = useTheme() as any;
  const [progress, setProgress] = useState(0);

  const { data: banners, isLoading } = useBanners(placement);

  const isDesktop = windowWidth >= BREAKPOINTS.desktopMin;
  const isTablet = windowWidth >= BREAKPOINTS.tabletMin;

  // Mobile math: 16px side inset so the banner never touches the screen
  // edge (rounded corners stay visible) and rotation/foldables update live.
  // Desktop keeps the wide cinematic banner inside the centered column.
  const maxW = isDesktop ? DESKTOP.maxWidth - DESKTOP.gutter * 2 : isTablet ? 720 : MAX_WIDTH;
  const sideInset = isDesktop || isTablet ? 0 : 16;
  const carouselWidth = isDesktop || isTablet ? Math.min(windowWidth - (isDesktop ? DESKTOP.gutter * 2 : 32), maxW) : Math.min(windowWidth - sideInset * 2, MAX_WIDTH);
  const isSmallScreen = windowWidth < 600;
  // On small screens, keep 180 height. On larger, use a ~2:1 aspect ratio
  const carouselHeight = isDesktop
    ? Math.min(400, Math.max(300, carouselWidth * 0.3))
    : isTablet
      ? carouselWidth * 0.42
      : isSmallScreen
        ? 180
        : carouselWidth * 0.48;

  if (isLoading) {
    return (
      <div
        className="w-full items-center self-center"
        style={{ paddingLeft: sideInset, paddingRight: sideInset }}
      >
        <div
          className="animate-pulse"
          style={{
            width: carouselWidth,
            height: carouselHeight,
            borderRadius: isDesktop ? 22 : 16,
            backgroundColor: theme.border,
          }}
        />
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div
      className="w-full items-center self-center"
      style={{ paddingLeft: sideInset, paddingRight: sideInset }}
    >
      <div
        className="overflow-hidden"
        style={
          isDesktop
            ? {
                width: carouselWidth,
                borderRadius: 22,
                boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
              }
            : { width: carouselWidth }
        }
      >
        <Carousel<Banner>
          width={carouselWidth}
          height={carouselHeight}
          data={banners}
          autoPlay
          loop
          autoPlayInterval={3500}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: isSmallScreen ? 0.94 : 0.98,
            parallaxScrollingOffset: isSmallScreen ? 25 : 10,
          }}
          onProgressChange={(_, absoluteProgress) => {
            setProgress(absoluteProgress);
          }}
          onConfigurePanGesture={(gesture) => {
            "worklet";
            gesture.activeOffsetX([-10, 10]);
          }}
          renderItem={({ item, index }) => (
            <CarouselSlide
              item={item}
              index={index}
              desktop={isDesktop}
              width={carouselWidth}
            />
          )}
        />

        {/* ── Dash indicators ── */}
        <div className="mt-2.5 flex flex-row items-center justify-center gap-1">
          {banners.map((_: Banner, i: number) => (
            <DashIndicator
              key={i}
              index={i}
              progress={progress}
              dataLength={banners.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopHomeCarousel;
