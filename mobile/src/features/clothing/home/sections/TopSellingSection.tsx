import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import LazyLottie from "@/src/components/common/LazyLottie";
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
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  getPublicProductsRequest,
  getTrendingProductsRequest,
} from "../../product/api/product.api";
import { IProduct } from "../../product/types/product.types";

const arrowLottie = require("@/assets/lottie/arrow.json");
const CARD_WIDTH = 240;
const GAP = 12;
const ITEM_WIDTH = CARD_WIDTH + GAP;
const TopSellingSection = ({ category }: { category?: string } = {}) => {
  const theme = useTheme() as any;
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const styles = React.useMemo(
    () => createTopSellingSectionStyles(theme),
    [theme],
  );

  const handleSeeAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/top-selling",
      params: category ? { category } : undefined,
    });
  };

  const { data: trendingProducts, isLoading } = useQuery({
    queryKey: ["trendingProducts", category],
    // Prefer the dedicated trending endpoint (it ranks by actual sales +
    // ratings + trending flag) and fall back to the public feed with
    // isTrending=true when there aren't enough sales-ranked products.
    queryFn: async () => {
      const [primaryRes, fallbackRes] = await Promise.allSettled([
        getTrendingProductsRequest(category ? { category } : undefined),
        getPublicProductsRequest({
          limit: 5,
          sortBy: "trending",
          category: category || undefined,
          isTrending: "true",
        }),
      ]);

      const primary: { data: IProduct[]; total: number } =
        primaryRes.status === "fulfilled"
          ? primaryRes.value
          : { data: [], total: 0 };
      if (primary.data.length >= 5) return primary;

      const fallback: { data: IProduct[]; total: number } =
        fallbackRes.status === "fulfilled"
          ? fallbackRes.value
          : { data: [], total: 0 };
      if (fallback.data.length > primary.data.length) {
        return fallback;
      }
      return primary;
    },
  });

  const products = (trendingProducts?.data || []).slice(0, 5);

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
          <Text
            accessibilityRole="header"
            aria-level={2}
            {...({ role: "heading" } as any)}
            style={styles.title}
          >
            Top Selling
          </Text>
          <View
            style={[
              localStyles.lottieWrapper,
              Platform.OS === "web" &&
                ({
                  filter: theme.text === "#ffffff" ? "invert(1)" : "none",
                } as any),
            ]}
          >
            <LazyLottie
              key={theme.text}
              source={arrowLottie}
              autoPlay
              loop
              resizeMode="contain"
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
        <TouchableOpacity
          style={styles.seeAllBtn}
          accessibilityRole="link"
          accessibilityLabel="See all top selling clothing"
          {...({ title: "See all top selling clothing and fashion in Bihar" } as any)}
          onPress={handleSeeAll}
          activeOpacity={0.7}
        >
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
