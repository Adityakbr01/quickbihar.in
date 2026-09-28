import React from "react";
import { View, Pressable, StyleSheet } from "react-native";

import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import * as Haptics from "@/lib/haptics";
import { useTrackClick } from "@/src/features/common/banner/hooks/useBanners";
import { Banner } from "@/src/features/common/banner/types/banner.types";

interface CarouselSlideProps {
  item: Banner;
  index: number;
  /** Desktop frame is much wider than the uploaded creative — render the
   * full image fitted (blurred fill behind) instead of cover-cropping it. */
  desktop?: boolean;
}

const CarouselSlide = ({ item, desktop }: CarouselSlideProps) => {
  const navigate = useNavigate();
  const trackClick = useTrackClick();

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Track click analytics
    trackClick.mutate(item._id);

    // Real-world redirection logic
    switch (item.redirectType) {
      case "category":
        goTo(navigate, {
          pathname: "/(tabs)/clothing/search" as any,
          params: {
            categoryId: item.redirectId || "",
            categoryName: item.title || "",
          },
        });
        break;
      case "collection":
        goTo(navigate, {
          pathname: "/(tabs)/clothing/search" as any,
          params: { query: item.title || "" },
        });
        break;
      case "product":
        if (item.redirectId) {
          goTo(navigate, {
            pathname: "/product/[id]" as any,
            params: { id: item.redirectId },
          });
        }
        break;
      case "external":
        if (item.externalUrl) {
          window.open(item.externalUrl, "_blank");
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
            borderRadius: desktop ? 22 : 16,
            overflow: "hidden",
            backgroundColor: desktop ? "#101012" : "transparent",
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        {desktop ? (
          /* Full creative, fitted — solid dark backdrop, no blur fill. */
          <img src={item.image} alt={item.title || "QuickBihar Fashion Sale Banner"} aria-label={item.title || "Fashion Sale Banner"} style={Object.assign({}, styles.desktopFit, { objectFit: "contain" as const })} {...({ title: item.title || "QuickBihar Online Fashion Deals" } as any)} />
        ) : (
          <img src={item.image} alt={item.title || "QuickBihar Fashion Sale Banner"} aria-label={item.title || "Fashion Sale Banner"} style={Object.assign({}, styles.slideImage, { objectFit: "cover" as const })} {...({ title: item.title || "QuickBihar Online Fashion Deals" } as any)} />
        )}
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
  desktopFit: {
    width: "100%",
    height: "100%",
  },
});

export default CarouselSlide;
