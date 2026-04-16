import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import React, { useCallback, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import LottieView from "lottie-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);
const fireLottie = require("@/assets/lottie/LoadingCat.json");
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
  const lottieRef = useRef<LottieView>(null);
  const [isRefreshingState, setIsRefreshingState] = useState(false);
  const scrollY = useSharedValue(0);
  const pullOffset = useSharedValue(0);
  const isRefreshing = useSharedValue(false);
  const hasTriggeredHaptic = useSharedValue(false);

  const performRefresh = useCallback(async () => {
    if (isRefreshing.value) {
      return;
    }

    setIsRefreshingState(true);
    isRefreshing.value = true;
    lottieRef.current?.play();

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics can fail on some devices/emulators; refresh should still continue.
    }

    try {
      await onRefresh();
    } finally {
      setIsRefreshingState(false);
      pullOffset.value = withTiming(0, { duration: 320 });

      setTimeout(() => {
        lottieRef.current?.reset();
        isRefreshing.value = false;
        hasTriggeredHaptic.value = false;
      }, 320);
    }
  }, [onRefresh]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const panGesture = Gesture.Pan()
    .enabled(!isRefreshingState)
    .onTouchesDown((_event, stateManager) => {
      if (scrollY.value > 0 || isRefreshing.value) {
        stateManager.fail();
      }
    })
    .onTouchesMove((_event, stateManager) => {
      if (scrollY.value > 0 || isRefreshing.value) {
        stateManager.fail();
      }
    })
    .activeOffsetY([10, 9999])
    .failOffsetX([-20, 20])
    .onUpdate((event) => {
      if (isRefreshing.value || event.translationY <= 0 || scrollY.value > 0) {
        return;
      }

      const nextOffset = Math.min(event.translationY * 0.55, MAX_PULL);
      pullOffset.value = nextOffset;

      if (nextOffset >= REFRESH_THRESHOLD && !hasTriggeredHaptic.value) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        hasTriggeredHaptic.value = true;
      }

      if (nextOffset < REFRESH_THRESHOLD && hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd(() => {
      if (isRefreshing.value) {
        return;
      }

      if (scrollY.value > 0) {
        pullOffset.value = withSpring(0, { damping: 14, stiffness: 120 });
        hasTriggeredHaptic.value = false;
        return;
      }

      if (pullOffset.value >= REFRESH_THRESHOLD) {
        pullOffset.value = withSpring(HOLD_OFFSET, {
          damping: 15,
          stiffness: 120,
        });
        runOnJS(performRefresh)();
      } else {
        pullOffset.value = withSpring(0, { damping: 14, stiffness: 120 });
      }
    })
    .onFinalize(() => {
      if (!isRefreshing.value && pullOffset.value < REFRESH_THRESHOLD) {
        pullOffset.value = withSpring(0, { damping: 14, stiffness: 120 });
      }
    });

  const nativeGesture = Gesture.Native();
  const composedGesture = Gesture.Simultaneous(nativeGesture, panGesture);

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: pullOffset.value }],
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pullOffset.value,
      [0, REFRESH_THRESHOLD],
      [0.35, 1],
      Extrapolate.CLAMP,
    );
    const opacity = interpolate(
      pullOffset.value,
      [0, REFRESH_THRESHOLD / 2],
      [0, 1],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale }],
      position: "absolute",
      top: -120,
      left: 0,
      right: 0,
      alignItems: "center",
      justifyContent: "center",
      height: 120,
      zIndex: 2,
    };
  });

  const lottieAnimatedProps = useAnimatedProps<any>(() => {
    if (isRefreshing.value) {
      return {};
    }

    return {
      progress: interpolate(
        pullOffset.value,
        [0, REFRESH_THRESHOLD],
        [0, 1],
        Extrapolate.CLAMP,
      ),
    };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeViewWrapper>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.container, wrapperStyle]}>
            <Animated.View style={headerStyle} pointerEvents="none">
              <AnimatedLottieView
                ref={lottieRef}
                source={fireLottie}
                autoPlay={false}
                loop={isRefreshingState}
                style={styles.fireLoader}
                animatedProps={lottieAnimatedProps}
              />
            </Animated.View>

            <Animated.ScrollView
              style={[styles.scrollView, { backgroundColor: theme.background }]}
              showsVerticalScrollIndicator={false}
              stickyHeaderIndices={stickyHeaderIndices}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              bounces={false}
              overScrollMode="never"
            >
              {children}
            </Animated.ScrollView>
          </Animated.View>
        </GestureDetector>
      </SafeViewWrapper>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  fireLoader: {
    width: 90,
    height: 90,
  },
});
