import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";

import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import type { Product } from "@/src/features/Jewelery/data/products";
import { APP_CURRENCY } from "@/src/constants";

const { width } = Dimensions.get("window");

const HERO_HEIGHT = 520;
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
 * Hero carousel. Feed it real catalog products and it builds shoppable
 * slides from their photos; otherwise brand slides render on emerald.
 * No mock imagery — every pixel is either server data or flat brand color.
 */
export function HeroCarousel({ items }: { items?: Product[] }) {
  const colors = useColors();
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
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slideCount = slides.length;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slideCount < 2) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slideCount;
        try {
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
        } catch {}
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [slideCount]);

  useEffect(() => {
    setActiveIndex(0);
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
      startTimer();
    },
    [startTimer]
  );

  const handleDotPress = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
    startTimer();
  };

  const renderSlide = ({ item }: { item: HeroSlide }) => (
    <View style={styles.slide}>
      {item.image ? (
        <Image source={item.image} style={styles.slideImage} resizeMode="cover" />
      ) : (
        <View style={[styles.slideImage, { backgroundColor: colors.emerald }]} />
      )}
      <View style={styles.overlay} />
      <View style={styles.slideContent}>
        <Text
          style={[
            styles.slideLabel,
            { color: colors.champagne, fontFamily: "DMSans_500Medium" },
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
        >
          {item.headline}
        </Text>
        <Text
          style={[
            styles.slideBody,
            { color: "rgba(247,243,236,0.82)", fontFamily: "DMSans_300Light" },
          ]}
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
                { color: colors.champagne, fontFamily: "DMSans_400Regular" },
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
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        decelerationRate="fast"
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <Pressable key={i} onPress={() => handleDotPress(i)} hitSlop={8}>
            <View
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
          </Pressable>
        ))}
      </View>

      {/* Slide counter */}
      <View style={styles.counter}>
        <Text
          style={[
            styles.counterText,
            { color: "rgba(247,243,236,0.6)", fontFamily: "DMSans_400Regular" },
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
    height: HERO_HEIGHT,
    position: "relative",
  },
  slide: {
    width,
    height: HERO_HEIGHT,
    position: "relative",
  },
  slideImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(26,22,20,0.40)",
  },
  slideContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 52,
    gap: 10,
  },
  slideLabel: {
    fontSize: 9,
    letterSpacing: 2,
  },
  slideHeadline: {
    fontSize: 40,
    lineHeight: 44,
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
