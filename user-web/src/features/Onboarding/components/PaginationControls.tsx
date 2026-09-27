import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export interface PaginationControlsProps {
  currentStep: number;
  totalSteps: number;
  onSkip: () => void;
  onNext: () => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentStep,
  totalSteps,
  onSkip,
  onNext,
}) => {
  return (
    <View style={styles.controls}>
      {/* Skip */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSkip();
        }}
        style={styles.skipBtn}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={20} color="rgba(255,255,255,0.75)" />
      </TouchableOpacity>

      {/* Dots */}
      <View style={styles.dots}>
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <Animated.View
            layout={LinearTransition.springify().damping(14).stiffness(120)}
            key={idx}
            style={[
              styles.dot,
              idx === currentStep ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Next */}
      <AnimatedTouchableOpacity
        layout={LinearTransition.springify().damping(14).stiffness(80)}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onNext();
        }}
        style={[
          styles.nextBtn,
          currentStep === totalSteps - 1 && styles.nextBtnDone,
        ]}
        activeOpacity={0.85}
      >
        {currentStep === totalSteps - 1 ? (
          <Text style={styles.finishText} numberOfLines={1}>Finish</Text>
        ) : (
          <Ionicons name="arrow-forward-outline" size={24} color="#fff" />
        )}
      </AnimatedTouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
  },
  skipBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(56, 56, 59, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 28,
    backgroundColor: "#1f2937",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "rgba(180,180,190,0.6)",
  },
  nextBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnDone: {
    width: 110,
    backgroundColor: "#000000ff",
  },
  finishText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});