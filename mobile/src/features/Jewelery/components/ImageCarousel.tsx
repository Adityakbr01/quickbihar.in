import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { useColors } from "@/src/features/Jewelery/hooks/useColors";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = width * (4 / 3);

interface ImageCarouselProps {
  images: any[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const thumbListRef = useRef<FlatList>(null);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
    thumbListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
  };

  const handleThumbPress = (index: number) => {
    setActiveIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
    thumbListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
  };

  const safeImages = (images ?? []).filter(Boolean);
  if (safeImages.length === 0) {
    return (
      <View
        style={{
          height: IMAGE_HEIGHT,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.champagne,
        }}
      >
        <Feather name="image" size={40} color={colors.gold} />
      </View>
    );
  }

  return (
    <View>
      {/* Main image pager */}
      <View style={{ height: IMAGE_HEIGHT }}>
        <FlatList
          ref={flatListRef}
          data={safeImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => String(i)}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <Image
              source={item}
              style={{ width, height: IMAGE_HEIGHT }}
              resizeMode="cover"
            />
          )}
        />

        {/* Dot indicators overlay */}
        <View style={styles.dots}>
          {safeImages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex
                      ? colors.gold
                      : "rgba(247,243,236,0.5)",
                  width: i === activeIndex ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>

        {/* Counter badge */}
        <View
          style={[
            styles.counterBadge,
            { backgroundColor: `${colors.ink}8C` },
          ]}
        >
          <Feather name="image" size={10} color={colors.ivory} style={{ marginRight: 4 }} />
          <View style={{ width: 0 }} />
        </View>

        {/* Left / right arrows */}
        {activeIndex > 0 && (
          <Pressable
            style={[styles.arrow, styles.arrowLeft, { backgroundColor: `${colors.pearl}D9` }]}
            onPress={() => handleThumbPress(activeIndex - 1)}
            hitSlop={8}
          >
            <Feather name="chevron-left" size={18} color={colors.ink} />
          </Pressable>
        )}
        {activeIndex < safeImages.length - 1 && (
          <Pressable
            style={[styles.arrow, styles.arrowRight, { backgroundColor: `${colors.pearl}D9` }]}
            onPress={() => handleThumbPress(activeIndex + 1)}
            hitSlop={8}
          >
            <Feather name="chevron-right" size={18} color={colors.ink} />
          </Pressable>
        )}
      </View>

      {/* Thumbnail strip */}
      {safeImages.length > 1 && (
        <View style={[styles.thumbStrip, { backgroundColor: colors.pearl }]}>
          <FlatList
            ref={thumbListRef}
            data={safeImages}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `thumb-${i}`}
            contentContainerStyle={styles.thumbList}
            getItemLayout={(_, index) => ({
              length: 68,
              offset: 68 * index + 16,
              index,
            })}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleThumbPress(index)}
                style={[
                  styles.thumb,
                  {
                    borderColor:
                      index === activeIndex ? colors.gold : "transparent",
                    borderWidth: index === activeIndex ? 2 : 1,
                    opacity: index === activeIndex ? 1 : 0.6,
                  },
                ]}
              >
                <Image
                  source={item}
                  style={styles.thumbImage}
                  resizeMode="cover"
                />
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  counterBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  thumbStrip: {
    paddingVertical: 10,
  },
  thumbList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 2,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
});
