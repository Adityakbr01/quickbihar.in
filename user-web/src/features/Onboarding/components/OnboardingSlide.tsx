import React from "react";
import { View, Text, StyleSheet } from "@/components/primitives";
import { ArrowDown } from "lucide-react";
import { OnboardingStepData } from "./types";
import { PaginationControls, PaginationControlsProps } from "./PaginationControls";
import { EdgeInsets } from "@/src/hooks/useSafeAreaInsets";

export interface OnboardingSlideProps extends PaginationControlsProps {
  step: OnboardingStepData;
  topStyle: any;
  iconStyle: any;
  bottomStyle: any;
  insets: EdgeInsets;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  step,
  topStyle,
  iconStyle,
  bottomStyle,
  insets,
  ...paginationProps
}) => {
  return (
    <>
      {/* Top section */}
      <View
        style={[styles.topSection, { paddingTop: insets.top + 40 }, topStyle]}
      >
        <Text style={styles.caption}>{step.caption}</Text>
        {/* <ArrowDown size={18} color="rgba(255,255,255,0.6)" style={{ marginVertical: 8 }} /> */}
        <Text style={styles.topTitle}>{step.title}</Text>
      </View>

      {/* Icon section */}
      <View style={styles.iconSection}>
        <View style={iconStyle}>{step.icon}</View>
      </View>

      {/* Bottom section (fades out during swipe) */}
      <View style={[styles.bottomSection, bottomStyle]}>
        <Text style={styles.bottomTitle}>{step.bottomTitle}</Text>
        <Text style={styles.bottomDesc}>{step.bottomDesc}</Text>
      </View>

      {/* Controls (static layout anchored to bottom) */}
      <View style={[styles.controlsSection, { paddingBottom: insets.bottom + 24 }]}>
        <PaginationControls {...paginationProps} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  topSection: {
    paddingHorizontal: 36,
    zIndex: 10,
  },
  caption: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  topTitle: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "500",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  iconSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  bottomSection: {
    paddingHorizontal: 36,
    zIndex: 10,
  },
  bottomTitle: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "500",
    lineHeight: 34,
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  bottomDesc: {
    color: "#374151",
    fontSize: 18,
    fontWeight: "300",
    lineHeight: 22,
  },
  controlsSection: {
    paddingHorizontal: 36,
    zIndex: 10,
  },
});