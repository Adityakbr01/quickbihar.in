import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import React, { useCallback } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import HomeHeader from "../components/HomeHeader";
import TopHomeCarousel from "../components/TopHomeCarousel";
import HomeCategories from "../components/HomeCategories";
import TopSellingSection from "../sections/TopSellingSection";
import TopMallSection from "../sections/TopMallSection";
import {
  useMoreDealsLogic,
  MoreDealsFilters,
  MoreDealsGrid,
} from "../sections/MoreDealsSection";
import { MoreDealsHeader } from "../components/MoreDealsHeader";

const HomeScreen = () => {
  const menuOpen = useSharedValue(0);

  const toggleMenu = useCallback(() => {
    menuOpen.value = menuOpen.value === 0 ? 1 : 0;
  }, [menuOpen]);

  const moreDealsState = useMoreDealsLogic();

  return (
    <SafeViewWrapper>
      {/* Set stickyHeaderIndices to 1, meaning the second direct child becomes sticky */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Child 0: Everything before the Sticky Filter */}
        <View style={localStyles.heroWrapper}>
          <HomeHeader menuOpen={menuOpen} toggleMenu={toggleMenu} />

          <View style={{ marginTop: 12 }}>
            <TopHomeCarousel />
          </View>
          <HomeCategories />

          <TopSellingSection />

          <TopMallSection />

          <MoreDealsHeader {...moreDealsState} />
        </View>

        {/* Child 1: The Sticky Filter Tabs! */}
        <MoreDealsFilters {...moreDealsState} />

        {/* Child 2: The Product Grid */}
        <View>
          <MoreDealsGrid {...moreDealsState} />
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

const localStyles = StyleSheet.create({
  heroWrapper: {
    overflow: "hidden",
  },
});

export default HomeScreen;
