import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";

import HomeCategories from "../../category/components/HomeCategories";
import HomeHeader from "../components/HomeHeader";
import { MoreDealsHeader } from "../components/MoreDealsHeader";
import TopHomeCarousel from "../components/TopHomeCarousel";
import {
  MoreDealsFilters,
  MoreDealsGrid,
  useMoreDealsLogic,
} from "../sections/MoreDealsSection";
import TopMallSection from "../sections/TopMallSection";
import TopSellingSection from "../sections/TopSellingSection";

const HomeScreen = () => {
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
        queryClient.invalidateQueries({ queryKey: ["publicCategories"] }),
        queryClient.invalidateQueries({ queryKey: ["trendingProducts"] }),
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

  return (
    <SafeViewWrapper>
      <ScrollView
        style={localStyles.scrollView}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Child 0: Everything before the Sticky Filter */}
        <View style={localStyles.heroWrapper}>
          <HomeHeader menuOpen={menuOpen} toggleMenu={toggleMenu} />

          <View style={{ marginTop: 12 }}>
            <TopHomeCarousel />
          </View>
          <HomeCategories />
          <TopMallSection />
          <TopSellingSection />
          <MoreDealsHeader {...moreDealsState} />
        </View>

        {/* Child 1: The Sticky Filter Tabs */}
        <MoreDealsFilters {...moreDealsState} />

        {/* Child 2: The Product Grid */}
        <View style={{ minHeight: Dimensions.get("window").height * 0.7 }}>
          <MoreDealsGrid {...moreDealsState} />
        </View>
      </ScrollView>
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
});

export default HomeScreen;
