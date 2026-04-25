import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
import { useBanners } from "../../banner/hooks/useBanners";
import { Banner } from "../../banner/types/banner.types";
import DashIndicator from "./carousel/DashIndicator";
import CarouselSlide from "./carousel/CarouselSlide";
import Skeleton from "@/src/components/common/Skeleton";

const MAX_WIDTH = 800;

const TopHomeCarousel = () => {
  const { width: windowWidth } = useWindowDimensions();
  const progressValue = useSharedValue(0);

  const { data: banners, isLoading } = useBanners("home_top");

  // Calculate responsive width and height
  const carouselWidth = Math.min(windowWidth, MAX_WIDTH);
  const isSmallScreen = windowWidth < 600;
  // On small screens, keep 180 height. On larger, use a ~2:1 aspect ratio
  const carouselHeight = isSmallScreen ? 180 : carouselWidth * 0.48;

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { width: windowWidth, paddingHorizontal: isSmallScreen ? 20 : 0 },
        ]}
      >
        <Skeleton
          width={carouselWidth - (isSmallScreen ? 40 : 0)}
          height={carouselHeight}
          borderRadius={16}
        />
      </View>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { width: windowWidth }]}>
      <View style={{ width: carouselWidth }}>
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
          renderItem={({ item, index }) => (
            <CarouselSlide item={item} index={index} />
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
