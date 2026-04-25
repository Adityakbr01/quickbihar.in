import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import LottieView from "lottie-react-native";
import React from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/ProductCardSkeleton";
import { createTopSellingSectionStyles } from "../style/TopSellingSection.style";

import { useQuery } from "@tanstack/react-query";
import { ScrollView as NativeScrollView } from "react-native";
import { getTrendingProductsRequest } from "../../product/api/product.api";

const arrowLottie = require("@/assets/lottie/arrow.json");

const TopSellingSection = () => {
  const theme = useTheme() as any;
  const styles = React.useMemo(
    () => createTopSellingSectionStyles(theme),
    [theme],
  );

  const { data: trendingProducts, isLoading } = useQuery({
    queryKey: ["trendingProducts"],
    queryFn: getTrendingProductsRequest,
  });

  const gap = 16;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <NativeScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { gap: 16 }]}
        >
          {[1, 2, 3].map((key) => (
            <ProductCardSkeleton key={key} />
          ))}
        </NativeScrollView>
      </View>
    );
  }

  // Optional: Hide section if no products found
  if (!trendingProducts || trendingProducts.total === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={localStyles.titleContainer}>
          <Text style={styles.title}>Top Selling </Text>
          <View
            style={[
              localStyles.lottieWrapper,
              Platform.OS === 'web' && { filter: theme.text === '#ffffff' ? 'invert(1)' : 'none' } as any
            ]}
          >
            <LottieView
              key={theme.text}
              source={arrowLottie}
              autoPlay
              loop
              resizeMode="contain"
              renderMode="SOFTWARE" // Essential for colorFilters to work on many Android devices
              style={[
                localStyles.arrowLottie,
                Platform.OS === 'web' && { filter: theme.text === '#ffffff' ? 'invert(1)' : 'none' } as any
              ]}
              colorFilters={
                theme.text === "#ffffff"
                  ? [
                    {
                      keypath: "Shape Layer 2.Shape 1.Stroke 1",
                      color: "#ffffff",
                    },
                    {
                      keypath: "Shape Layer 2.Shape 2.Stroke 1",
                      color: "#ffffff",
                    },
                    {
                      keypath: "**", // Fallback wildcard
                      color: "#ffffff",
                    },
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
      <FlatList
        data={trendingProducts.data || []}
        renderItem={({ item }) => <ProductCard item={item} />}
        keyExtractor={(item: any) => item._id || item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={210 + gap} // Exact physical bounds from card width (210) + gap (16)
        decelerationRate="fast"
      />
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
    paddingTop: 10
  },
  arrowLottie: {
    width: "100%",
    height: "100%",
  },
});

export default TopSellingSection;
