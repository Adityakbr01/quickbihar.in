import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import React, { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import LazyLottie from "@/src/components/common/LazyLottie";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

import fireLottie from "@/assets/lottie/LoadingCat.json";

const REFRESH_THRESHOLD = 90;
const MAX_PULL = 150;
const HOLD_OFFSET = 110;

interface SnapchatPullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  stickyHeaderIndices?: number[];
}

export default function SnapchatPullToRefresh({
  onRefresh,
  children,
  stickyHeaderIndices,
}: SnapchatPullToRefreshProps) {
  const theme = useTheme() as any;
  const [isRefreshingState, setIsRefreshingState] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const scrollY = useRef(0);
  const refreshingRef = useRef(false);
  const hapticFiredRef = useRef(false);
  const dragStartY = useRef(0);

  const performRefresh = useCallback(async () => {
    if (refreshingRef.current) {
      return;
    }

    setIsRefreshingState(true);
    refreshingRef.current = true;
    setPullOffset(HOLD_OFFSET);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics can fail on some devices/emulators; refresh should still continue.
    }

    try {
      await onRefresh();
    } finally {
      setIsRefreshingState(false);
      setPullOffset(0);
      setTimeout(() => {
        refreshingRef.current = false;
        hapticFiredRef.current = false;
      }, 320);
    }
  }, [onRefresh]);

  const handleScroll = (event: any) => {
    const top =
      event?.nativeEvent?.contentOffset?.y ?? event?.currentTarget?.scrollTop ?? 0;
    scrollY.current = top;
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (scrollY.current > 0 || refreshingRef.current) return;
    dragStartY.current = event.clientY;
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragging || refreshingRef.current || scrollY.current > 0) return;
    const dy = event.clientY - dragStartY.current;
    if (dy <= 0) {
      if (pullOffset !== 0) setPullOffset(0);
      return;
    }
    const nextOffset = Math.min(dy * 0.55, MAX_PULL);
    setPullOffset(nextOffset);

    if (nextOffset >= REFRESH_THRESHOLD && !hapticFiredRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      hapticFiredRef.current = true;
    }
    if (nextOffset < REFRESH_THRESHOLD && hapticFiredRef.current) {
      hapticFiredRef.current = false;
    }
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (refreshingRef.current) return;
    if (pullOffset >= REFRESH_THRESHOLD) {
      void performRefresh();
    } else {
      setPullOffset(0);
      hapticFiredRef.current = false;
    }
  };

  const pullRatio = Math.min(Math.max(pullOffset / REFRESH_THRESHOLD, 0), 1);

  return (
    <View style={styles.container}>
      <SafeViewWrapper>
        <View
          style={[
            styles.container,
            {
              transform: [{ translateY: pullOffset }],
              transition: dragging ? undefined : "transform 0.25s ease-out",
            },
          ]}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <View
            style={[
              {
                opacity: pullRatio,
                transform: [{ scale: 0.35 + pullRatio * 0.65 }],
                transition: dragging ? undefined : "opacity 0.25s ease-out, transform 0.25s ease-out",
                position: "absolute",
                top: -120,
                left: 0,
                right: 0,
                alignItems: "center",
                justifyContent: "center",
                height: 120,
                zIndex: 2,
              },
              { pointerEvents: "none" },
            ]}
          >
            <LazyLottie
              source={fireLottie}
              autoPlay={isRefreshingState}
              loop={isRefreshingState}
              style={styles.fireLoader}
            />
          </View>

          <ScrollView
            style={[styles.scrollView, { backgroundColor: theme.background }]}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={stickyHeaderIndices}
            onScroll={handleScroll}
            bounces={false}
            overScrollMode="never"
          >
            {children}
          </ScrollView>
        </View>
      </SafeViewWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    overflowY: "auto",
  },
  fireLoader: {
    width: 90,
    height: 90,
  },
});
