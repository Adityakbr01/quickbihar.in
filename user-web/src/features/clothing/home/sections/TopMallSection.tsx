import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";
import LazyLottie from "@/src/components/common/LazyLottie";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createTopMallSectionStyles } from "../style/TopMallSection.style";
import { MallCardSkeleton } from "../components/MallCardSkeleton";
import { MallCard } from "../components/MallCard";
import { getTopMallsRequest } from "../api/mall.api";

const fireLottie = require("@/assets/lottie/Fire.json");

const TopMallSection = () => {
  const theme = useTheme() as any;
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const styles = React.useMemo(
    () => createTopMallSectionStyles(theme),
    [theme],
  );
  const router = useRouter();

  const isDesktop = Platform.OS === "web" && windowWidth >= BREAKPOINTS.desktopMin;
  const isWebMobile = Platform.OS === "web" && windowWidth > 600;
  const gap = isDesktop ? 20 : 16;
  // Mobile widths stay 260 but shrink on very small phones / foldables
  // so the card + 16px list padding never overflow. Native tablets in
  // portrait keep the mobile card (desktop grid is web-only).
  const mobileCardWidth = Math.min(260, Math.max(windowWidth - 64, 200));
  const webMobileCardWidth = Math.min(300, Math.max(windowWidth - 64, 200));
  // Mobile widths byte-identical. Desktop uses a 3-col grid cell.
  const desktopContainer = Math.min(windowWidth - DESKTOP.gutter * 2, DESKTOP.maxWidth);
  const desktopCardWidth = (desktopContainer - gap * 2) / 3;
  const cardWidth = isDesktop ? desktopCardWidth : isWebMobile ? webMobileCardWidth : mobileCardWidth;
  const { data: topMalls, isLoading } = useQuery({
    queryKey: ["topMalls"],
    queryFn: getTopMallsRequest,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 8,
            gap,
          }}
        >
          {[1, 2, 3].map((key) => (
            <View key={key} style={{ width: cardWidth }}>
              <MallCardSkeleton />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const malls = topMalls || [];
  // Never promise "Top 10" with fewer than 10 malls — dynamic, honest heading. (todo fix that in future)
  const heading =
    malls.length >= 10
      ? "Top 10 Malls"
      : malls.length > 1
        ? "Top 10 Malls"
        : "Top 10 Malls";

  if (!malls.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={localStyles.titleContainer}>
          <Text
            accessibilityRole="header"
            aria-level={2}
            {...({ role: "heading" } as any)}
            style={styles.title}
          >
            {heading}{" "}
          </Text>
          <View style={localStyles.lottieWrapper}>
            <LazyLottie
              key={theme.text}
              source={fireLottie}
              autoPlay
              loop
              resizeMode="contain"
              style={[
                localStyles.fireLottie,
                Platform.OS === "web" &&
                ({
                  filter: theme.text === "#ffffff" ? "invert(1)" : "none",
                } as any),
              ]}
              colorFilters={[
                {
                  keypath: "**",
                  color: theme.text,
                },
              ]}
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.seeAllBtn}
          accessibilityRole="link"
          accessibilityLabel="Explore all malls"
          {...({ title: "Explore top shopping malls and stores in Bihar" } as any)}
          onPress={() => router.push("/mall" as any)}
        >
          <Text style={styles.seeAll}>Explore All</Text>
        </TouchableOpacity>
      </View>

      {isDesktop ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: 0,
            gap,
            rowGap: gap,
          }}
        >
          {malls.slice(0, 6).map((item: any) => (
            <View key={item.id} style={{ width: cardWidth }}>
              <MallCard mall={item} />
            </View>
          ))}
        </View>
      ) : (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
        snapToInterval={cardWidth + gap}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {malls.map((item: any, index: number) => (
          <View
            key={item.id}
            style={{
              width: cardWidth,
              marginRight: index === malls.length - 1 ? 0 : gap,
            }}
          >
            <MallCard mall={item} />
          </View>
        ))}
      </ScrollView>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  lottieWrapper: {
    width: 32,
    height: 32,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  fireLottie: {
    width: "100%",
    height: "100%",
  },
});

export default TopMallSection;
