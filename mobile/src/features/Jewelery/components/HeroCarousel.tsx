import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";

import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import type { Product } from "@/src/features/Jewelery/data/products";
import { APP_CURRENCY } from "@/src/constants";

const AUTO_SCROLL_INTERVAL = 4500;

interface HeroSlide {
  id: string;
  image?: any;
  label: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaRoute: string;
  secondaryCta?: string;
}

const BRAND_SLIDES: HeroSlide[] = [
  {
    id: "s1",
    label: "NEW ARRIVALS — SUMMER EDIT",
    headline: "For the woman\nwho wears gold\nlike a second skin.",
    body: "Handcrafted fine jewellery rooted in Indian tradition.",
    ctaLabel: "Explore the Collection →",
    ctaRoute: "/jewelery/collections",
    secondaryCta: "Shop Bridal →",
  },
  {
    id: "s2",
    label: "BRIDAL 2026",
    headline: "Because you've\nimagined this moment\nsince you were seven.",
    body: "Sacred. Heirloom. Forever. Our bridal collection awaits.",
    ctaLabel: "Explore Bridal →",
    ctaRoute: "/jewelery/collections",
    secondaryCta: "Book a Consultation →",
  },
  {
    id: "s3",
    label: "FESTIVE EDIT",
    headline: "For the nights that\nsmell like agarbatti\nand feel like magic.",
    body: "Kundan, polki and gold — curated for every celebration.",
    ctaLabel: "Shop Festive →",
    ctaRoute: "/jewelery/collections",
    secondaryCta: "Book a Consultation →",
  },
  {
    id: "s4",
    label: "STATEMENT PIECES",
    headline: "Not subtle.\nNot sorry.\nJust gold.",
    body: "Bold artisan pieces for the woman who commands attention.",
    ctaLabel: "Shop Statement →",
    ctaRoute: "/jewelery/collections",
  },
];

/**
 * Hero carousel powered by react-native-reanimated-carousel for butter-smooth
 * snapping, responsive resizing, and authentic luxury presentation.
 */
export function HeroCarousel({ items }: { items?: Product[] }) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const carouselWidth = windowWidth;
  const carouselHeight = Math.min(Math.max(windowWidth * 1.15, 380), 500);

  const withPhotos = (items ?? []).filter((p) => p.image);
  const slides: HeroSlide[] = withPhotos.length
    ? withPhotos.slice(0, 4).map((p) => ({
        id: `p-${p.id}`,
        image: p.image,
        label: p.collection?.toUpperCase() || "FEATURED",
        headline: p.name,
        body: `${p.subtitle} · ${APP_CURRENCY}${p.price.toLocaleString("en-IN")}`,
        ctaLabel: "Shop This Piece →",
        ctaRoute: `/jewelery/product/${p.id}`,
      }))
    : BRAND_SLIDES;

  return (
    <View
      style={[
        styles.container,
        { width: carouselWidth, height: carouselHeight },
      ]}
    >
      <Carousel<HeroSlide>
        width={carouselWidth}
        height={carouselHeight}
        data={slides}
        autoPlay
        loop
        autoPlayInterval={AUTO_SCROLL_INTERVAL}
        onSnapToItem={(index) => setActiveIndex(index)}
        onConfigurePanGesture={(gesture) => {
          "worklet";
          gesture.activeOffsetX([-10, 10]);
        }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.slide,
              { width: carouselWidth, height: carouselHeight },
            ]}
          >
            {item.image ? (
              <Image
                source={
                  typeof item.image === "string"
                    ? { uri: item.image }
                    : item.image
                }
                style={styles.slideImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.slideImage,
                  { backgroundColor: colors.emerald },
                ]}
              />
            )}
            <View style={styles.overlay} />
            <View style={styles.slideContent}>
              <Text
                style={[
                  styles.slideLabel,
                  { color: colors.gold, fontFamily: "DMSans_500Medium" },
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.slideHeadline,
                  {
                    color: "#F7F3EC",
                    fontFamily: "CormorantGaramond_300Light_Italic",
                  },
                ]}
                numberOfLines={3}
              >
                {item.headline}
              </Text>
              <Text
                style={[
                  styles.slideBody,
                  {
                    color: "rgba(247,243,236,0.85)",
                    fontFamily: "DMSans_300Light",
                  },
                ]}
                numberOfLines={2}
              >
                {item.body}
              </Text>
              <View style={styles.ctaRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.ctaBtn,
                    {
                      borderColor: colors.gold,
                      backgroundColor: pressed
                        ? "rgba(184,146,74,0.18)"
                        : "transparent",
                    },
                  ]}
                  onPress={() => router.push(item.ctaRoute as any)}
                >
                  <Text
                    style={[
                      styles.ctaBtnText,
                      { color: colors.gold, fontFamily: "DMSans_400Regular" },
                    ]}
                  >
                    {item.ctaLabel}
                  </Text>
                </Pressable>
                {item.secondaryCta && (
                  <Pressable onPress={() => router.push(item.ctaRoute as any)}>
                    <Text
                      style={[
                        styles.secondaryCta,
                        {
                          color: "rgba(247,243,236,0.7)",
                          fontFamily: "DMSans_400Regular",
                        },
                      ]}
                    >
                      {item.secondaryCta}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}
      />

      {/* Dot indicators */}
      <View style={styles.dots} pointerEvents="none">
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === activeIndex
                    ? colors.gold
                    : "rgba(247,243,236,0.45)",
                width: i === activeIndex ? 20 : 6,
              },
            ]}
          />
        ))}
      </View>

      {/* Slide counter */}
      <View style={styles.counter} pointerEvents="none">
        <Text
          style={[
            styles.counterText,
            {
              color: "rgba(247,243,236,0.6)",
              fontFamily: "DMSans_400Regular",
            },
          ]}
        >
          {activeIndex + 1} / {slides.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  slide: {
    position: "relative",
    overflow: "hidden",
  },
  slideImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(18, 15, 13, 0.45)",
  },
  slideContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 48,
    gap: 10,
  },
  slideLabel: {
    fontSize: 9,
    letterSpacing: 2,
  },
  slideHeadline: {
    fontSize: 28,
    lineHeight: 34,
  },
  slideBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  ctaRow: {
    gap: 10,
    marginTop: 4,
  },
  ctaBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
    borderRadius: 1,
  },
  ctaBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  secondaryCta: {
    fontSize: 12,
    letterSpacing: 1,
  },
  dots: {
    position: "absolute",
    bottom: 16,
    left: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  counter: {
    position: "absolute",
    bottom: 18,
    right: 20,
  },
  counterText: {
    fontSize: 10,
    letterSpacing: 1,
  },
});
