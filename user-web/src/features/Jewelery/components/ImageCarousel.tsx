import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "@/components/primitives";

import { useColors } from "@/src/features/Jewelery/hooks/useColors";

interface ImageCarouselProps {
  images: any[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const colors = useColors();
  // Live viewport width — a module-level Dimensions.get() goes stale on
  // resize/device-emulation/rotation and makes images wider than the
  // screen, which stretches the whole page (incl. the sticky action bar).
  const { width } = useWindowDimensions();
  // Square 1:1 gallery — the old 4:3 frame was far too tall and pushed
  // the details + Add to Bag bar way down the page.
  const imageHeight = width;
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
      <View style={{
          height: imageHeight,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.champagne,
        }}
      >
        <ImageIcon size={40} color={colors.gold} />
      </View>
    );
  }

  return (
    <View>
      {/* Main image pager */}
      <View style={{ height: imageHeight }}>
        <FlatList ref={flatListRef}
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
            <Image source={item}
              style={{ width, height: imageHeight }}
              resizeMode="cover"
            />
          )}
        />

        {/* Dot indicators overlay */}
        <View style={styles.dots}>
          {safeImages.map((_, i) => (
            <View key={i}
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
        <View style={[
            styles.counterBadge,
            { backgroundColor: `${colors.ink}8C` },
          ]}
        >
          <ImageIcon size={10} color={colors.onBrand} style={{ marginRight: 4 }} />
          <View style={{ width: 0 }} />
        </View>

        {/* Left / right arrows */}
        {activeIndex > 0 && (
          <Pressable style={[styles.arrow, styles.arrowLeft, { backgroundColor: `${colors.pearl}D9` }]}
            onPress={() => handleThumbPress(activeIndex - 1)}
            hitSlop={8}
          >
            <ChevronLeft size={18} color={colors.ink} />
          </Pressable>
        )}
        {activeIndex < safeImages.length - 1 && (
          <Pressable style={[styles.arrow, styles.arrowRight, { backgroundColor: `${colors.pearl}D9` }]}
            onPress={() => handleThumbPress(activeIndex + 1)}
            hitSlop={8}
          >
            <ChevronRight size={18} color={colors.ink} />
          </Pressable>
        )}
      </View>

      {/* Thumbnail strip */}
      {safeImages.length > 1 && (
        <View style={[styles.thumbStrip, { backgroundColor: colors.pearl }]}>
          <FlatList ref={thumbListRef}
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
              <Pressable onPress={() => handleThumbPress(index)}
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
                <Image source={item}
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
