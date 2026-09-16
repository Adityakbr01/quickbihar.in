import React from "react";
import { Platform, View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
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
            borderRadius: desktop ? 22 : 16,
            overflow: "hidden",
            backgroundColor: desktop ? "#1c1c1e" : "transparent",
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        {desktop ? (
          <>
            {/* Blurred fill so any creative aspect fills the wide frame. */}
            <Image
              source={{ uri: item.image }}
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ scale: 1.25 }] },
                Platform.OS === "web"
                  ? ({ filter: "blur(28px) brightness(0.85)" } as any)
                  : null,
            ]}
              contentFit="cover"
              blurRadius={Platform.OS === "web" ? undefined : 24}
              accessibilityLabel=""
            />
            {/* Full creative, never cropped. */}
            <Image
              source={{ uri: item.image }}
              style={styles.desktopFit}
              contentFit="contain"
              alt={item.title || "QuickBihar Fashion Sale Banner"}
              accessibilityLabel={item.title || "Fashion Sale Banner"}
              {...({ title: item.title || "QuickBihar Online Fashion Deals" } as any)}
            />
          </>
        ) : (
          <Image
            source={{ uri: item.image }}
            style={styles.slideImage}
            contentFit="cover"
            alt={item.title || "QuickBihar Fashion Sale Banner"}
            accessibilityLabel={item.title || "Fashion Sale Banner"}
            {...({ title: item.title || "QuickBihar Online Fashion Deals" } as any)}
          />
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
