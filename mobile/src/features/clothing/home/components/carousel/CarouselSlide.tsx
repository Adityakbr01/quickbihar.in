import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { useTrackClick } from "@/src/features/common/banner/hooks/useBanners";
import { Banner } from "@/src/features/common/banner/types/banner.types";

interface CarouselSlideProps {
  item: Banner;
  index: number;
}

const CarouselSlide = ({ item }: CarouselSlideProps) => {
  const router = useRouter();
  const trackClick = useTrackClick();

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Track click analytics
    trackClick.mutate(item._id);

    // Real-world redirection logic
    switch (item.redirectType) {
      case "category":
        router.push({
          pathname: "/(tabs)/clothing/search" as any,
          params: {
            categoryId: item.redirectId || "",
            categoryName: item.title || "",
          },
        });
        break;
      case "collection":
        router.push({
          pathname: "/(tabs)/clothing/search" as any,
          params: { query: item.title || "" },
        });
        break;
      case "product":
        if (item.redirectId) {
          router.push({
            pathname: "/product/[id]" as any,
            params: { id: item.redirectId },
          });
        }
        break;
      case "external":
        if (item.externalUrl) {
          await WebBrowser.openBrowserAsync(item.externalUrl);
        }
        break;
      default:
        console.warn(`Unhandled redirection type: ${item.redirectType}`);
    }
  };

  return (
    <View style={styles.slide}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="link"
        accessibilityLabel={item.title || "QuickBihar Fashion Sale Banner"}
        {...({ title: item.title || "QuickBihar Online Fashion Offer" } as any)}
        style={({ pressed }) => [
          {
            width: "100%",
            height: "100%",
            borderRadius: 16,
            overflow: "hidden",
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.slideImage}
          contentFit="cover"
          alt={item.title || "QuickBihar Fashion Sale Banner"}
          accessibilityLabel={item.title || "Fashion Sale Banner"}
          {...({ title: item.title || "QuickBihar Online Fashion Deals" } as any)}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slideImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 16,
  },
});

export default CarouselSlide;
