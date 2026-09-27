import React from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
import { useBanners } from "@/src/features/common/banner/hooks/useBanners";
import { Banner } from "@/src/features/common/banner/types/banner.types";
import DashIndicator from "./carousel/DashIndicator";
import CarouselSlide from "./carousel/CarouselSlide";
import Skeleton from "@/src/components/common/Skeleton";
import { BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";

const MAX_WIDTH = 800;

const TopHomeCarousel = () => {
  const { width: windowWidth } = useWindowDimensions();
  const progressValue = useSharedValue(0);

  const { data: banners, isLoading } = useBanners("home_top");

  const isDesktop = Platform.OS === "web" && windowWidth >= BREAKPOINTS.desktopMin;
  const isTablet = Platform.OS === "web" && windowWidth >= BREAKPOINTS.tabletMin;

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
      <View
        style={[
          styles.container,
          isDesktop || isTablet
            ? { width: "100%", alignSelf: "center", paddingHorizontal: 0 }
            : { width: "100%", alignSelf: "center", paddingHorizontal: sideInset },
        ]}
      >
        <Skeleton
          width={carouselWidth}
          height={carouselHeight}
          borderRadius={isDesktop ? 22 : 16}
        />
      </View>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        isDesktop || isTablet
          ? { width: "100%", alignSelf: "center", paddingHorizontal: 0 }
          : { width: "100%", alignSelf: "center", paddingHorizontal: sideInset },
      ]}
    >
      <View
        style={
          isDesktop
            ? {
                width: carouselWidth,
                borderRadius: 22,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.16,
                shadowRadius: 28,
                elevation: 8,
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
            progressValue.value = absoluteProgress;
          }}
          onConfigurePanGesture={(gesture) => {
            "worklet";
            gesture.activeOffsetX([-10, 10]);
          }}
          renderItem={({ item, index }) => (
            <CarouselSlide item={item} index={index} desktop={isDesktop} />
          )}
        />

        {/* ── Dash indicators ── */}
        <View style={styles.pagination}>
          {banners.map((_: Banner, i: number) => (
            <DashIndicator
              key={i}
              index={i}
              progressValue={progressValue}
              dataLength={banners.length}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default TopHomeCarousel;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
  },
});
