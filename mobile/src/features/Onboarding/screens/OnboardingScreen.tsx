import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { PanResponder, StatusBar, StyleSheet, View } from "react-native";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { lightTheme } from "@/src/theme/colors";
import { OnboardingSlide, steps } from "../components";
import { AuthScreen } from "../../common/auth";

// ─── Main Screen ─────────────────────────────────────────────

export default function OnboardingScreen({ onDone }: { onDone?: () => void }) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [displayStep, setDisplayStep] = useState(0);
  const [complete, setComplete] = useState(false);

  const topOpacity = useSharedValue(1);
  const topY = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconOpacity = useSharedValue(1);
  const bottomOpacity = useSharedValue(1);
  const bottomY = useSharedValue(0);
  const completionScale = useSharedValue(0.8);
  const completionOpacity = useSharedValue(0);

  const transition = (nextStep: number | null) => {
    // Fade out
    topOpacity.value = withTiming(0, { duration: 280 });
    topY.value = withTiming(-16, { duration: 280 });
    iconScale.value = withTiming(0.88, { duration: 280 });
    iconOpacity.value = withTiming(0, { duration: 280 });
    bottomOpacity.value = withTiming(0, { duration: 280 });
    bottomY.value = withTiming(16, { duration: 280 });

    setTimeout(() => {
      if (nextStep === null) {
        setComplete(true);
        completionScale.value = withSpring(1, { damping: 14, stiffness: 120 });
        completionOpacity.value = withTiming(1, { duration: 400 });
      } else {
        setDisplayStep(nextStep);
        topY.value = 16;
        bottomY.value = -16;

        topOpacity.value = withTiming(1, { duration: 320 });
        topY.value = withTiming(0, {
          duration: 320,
          easing: Easing.out(Easing.cubic),
        });
        iconScale.value = withSpring(1, { damping: 14, stiffness: 140 });
        iconOpacity.value = withTiming(1, { duration: 320 });
        bottomOpacity.value = withTiming(1, { duration: 320 });
        bottomY.value = withTiming(0, {
          duration: 320,
          easing: Easing.out(Easing.cubic),
        });
      }
    }, 300);
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      transition(null);
    } else {
      const next = currentStep + 1;
      setCurrentStep(next);
      transition(next);
    }
  };

  const handleSkip = () => {
    setCurrentStep(steps.length - 1);
    transition(null);
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      transition(prev);
    }
  };

  const handleNextRef = useRef(handleNext);
  const handlePrevRef = useRef(handlePrev);

  useEffect(() => {
    handleNextRef.current = handleNext;
    handlePrevRef.current = handlePrev;
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 30 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // Swiped left
          handleNextRef.current();
        } else if (gestureState.dx > 50) {
          // Swiped right
          handlePrevRef.current();
        }
      },
    }),
  ).current;

  const topStyle = useAnimatedStyle(() => ({
    opacity: topOpacity.value,
    transform: [{ translateY: topY.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    opacity: bottomOpacity.value,
    transform: [{ translateY: bottomY.value }],
  }));
  const completionStyle = useAnimatedStyle(() => ({
    opacity: completionOpacity.value,
    transform: [{ scale: completionScale.value }],
  }));

  const step = steps[displayStep];

  if (complete) {
    return <AuthScreen />;
  }

  return (
    <View style={styles.screen} {...panResponder.panHandlers}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={lightTheme.spgradient}
        locations={[0, 0.28, 0.52, 0.78, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <OnboardingSlide
        step={step}
        topStyle={topStyle}
        iconStyle={iconStyle}
        bottomStyle={bottomStyle}
        insets={insets}
        currentStep={currentStep}
        totalSteps={steps.length}
        onSkip={handleSkip}
        onNext={handleNext}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
  },
});
