import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import LottieView from "lottie-react-native";
import React, { useRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/ProductCardSkeleton";
import { createTopSellingSectionStyles } from "../style/TopSellingSection.style";

import { useQuery } from "@tanstack/react-query";
import { getTrendingProductsRequest } from "../../product/api/product.api";

const arrowLottie = require("@/assets/lottie/arrow.json");
const CARD_WIDTH = 240;
const GAP = 12;
const ITEM_WIDTH = CARD_WIDTH + GAP;
const TopSellingSection = () => {
  const theme = useTheme() as any;
  const scrollRef = useRef<ScrollView>(null);
  const styles = React.useMemo(
    () => createTopSellingSectionStyles(theme),
    [theme],
  );

  const { data: trendingProducts, isLoading } = useQuery({
    queryKey: ["trendingProducts"],
    queryFn: getTrendingProductsRequest,
  });

  const products = (trendingProducts?.data || []).slice(0, 10);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 8,
            gap: GAP,
          }}
        >
          {[1, 2, 3].map((key) => (
            <View key={key} style={{ width: CARD_WIDTH }}>
              <ProductCardSkeleton />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!trendingProducts || trendingProducts.total === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={localStyles.titleContainer}>
          <Text style={styles.title}>Top Selling</Text>
          <View
            style={[
              localStyles.lottieWrapper,
              Platform.OS === "web" &&
                ({
                  filter: theme.text === "#ffffff" ? "invert(1)" : "none",
                } as any),
            ]}
          >
            <LottieView
              key={theme.text}
              source={arrowLottie}
              autoPlay
              loop
              resizeMode="contain"
              renderMode="SOFTWARE"
              style={[
                localStyles.arrowLottie,
                Platform.OS === "web" &&
                  ({
                    filter: theme.text === "#ffffff" ? "invert(1)" : "none",
                  } as any),
              ]}
              colorFilters={
                theme.text === "#ffffff"
                  ? [
                      { keypath: "Shape Layer 2.Shape 1.Stroke 1", color: "#ffffff" },
                      { keypath: "Shape Layer 2.Shape 2.Stroke 1", color: "#ffffff" },
                      { keypath: "**", color: "#ffffff" },
                    ]
                  : []
              }
            />
          </View>
        </View>
        <TouchableOpacity style={styles.seeAllBtn}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        contentOffset={{ x: 0, y: 0 }}
      >
        {products.map((item: any, index: number) => (
          <View
            key={item._id || item.id}
            style={{
              width: CARD_WIDTH,
              marginRight: index === products.length - 1 ? 0 : GAP,
            }}
          >
            <ProductCard item={item} />
          </View>
        ))}
      </ScrollView>
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
    paddingTop: 10,
  },
  arrowLottie: {
    width: "100%",
    height: "100%",
  },
});

export default TopSellingSection;
