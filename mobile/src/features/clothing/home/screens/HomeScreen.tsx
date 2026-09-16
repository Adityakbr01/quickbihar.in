import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import HomeCategories from "@/src/features/common/category/components/HomeCategories";
import HomeHeader from "../components/HomeHeader";
import { DesktopFooter } from "../components/DesktopFooter";
import { MoreDealsHeader } from "../components/MoreDealsHeader";
import TopHomeCarousel from "../components/TopHomeCarousel";
import {
  MoreDealsFilters,
  MoreDealsGrid,
  useMoreDealsLogic,
} from "../sections/MoreDealsSection";
import TopMallSection from "../sections/TopMallSection";
import TopSellingSection from "../sections/TopSellingSection";
import { BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";

const HomeScreen = ({ rootSlug }: { rootSlug?: string }) => {
  const menuOpen = useSharedValue(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleMenu = useCallback(() => {
    menuOpen.value = menuOpen.value === 0 ? 1 : 0;
  }, [menuOpen]);

  const moreDealsState = useMoreDealsLogic();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["banners"] }),
        queryClient.invalidateQueries({ queryKey: ["trendingProducts"] }),
        queryClient.invalidateQueries({ queryKey: ["topMalls"] }),
        queryClient.invalidateQueries({ queryKey: ["paginatedProducts"] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
      ]);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, queryClient]);

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;
  const isWide = Platform.OS === "web" && width >= BREAKPOINTS.tabletMin;

  return (
    <SafeViewWrapper>
      <View style={localStyles.scrollView}>
        <ScrollView
          style={localStyles.scrollView}
          contentContainerStyle={isWide ? localStyles.desktopContent : undefined}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={isDesktop ? undefined : [1]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {/* Child 0: Everything before the Sticky Filter */}
          <View style={[localStyles.heroWrapper, isWide && localStyles.desktopColumn]}>
            <HomeHeader menuOpen={menuOpen} toggleMenu={toggleMenu} />

            <View style={{ marginTop: isDesktop ? 20 : 12, width: "100%" }}>
              {/* He is Done */}
              <TopHomeCarousel />
            </View>
            {/* He is Done */}
            <HomeCategories rootSlug={rootSlug} />
            {/* Not Started */}
            <TopMallSection />
            <TopSellingSection />
            <MoreDealsHeader {...moreDealsState} />
          </View>

          {/* Child 1: The Sticky Filter Tabs (sticky only on mobile; on
              desktop the top DesktopNavbar is the persistent chrome) */}
          <View style={isWide ? localStyles.desktopColumn : undefined}>
            <MoreDealsFilters {...moreDealsState} />
          </View>

          {/* Child 2: The Product Grid */}
          <View
            style={[
              { minHeight: Dimensions.get("window").height * 0.7 },
              isWide && localStyles.desktopColumn,
            ]}
          >
            <MoreDealsGrid {...moreDealsState} />
          </View>

          {isDesktop ? <DesktopFooter /> : null}
        </ScrollView>
      </View>
    </SafeViewWrapper>
  );
};

const localStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  heroWrapper: {
    overflow: "hidden",
  },
  // Desktop-only: centered 1280px column. Never applied on mobile.
  desktopContent: {
    alignItems: "center",
  },
  desktopColumn: {
    width: "100%",
    maxWidth: DESKTOP.maxWidth,
    alignSelf: "center",
    marginHorizontal: "auto" as any,
    paddingHorizontal: DESKTOP.gutter,
  },
});

export default HomeScreen;
