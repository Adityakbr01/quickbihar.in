import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

interface Props {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const ornamentOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo fades + scales in
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
      ]),
      // 2. Ornament and line appear
      Animated.parallel([
        Animated.timing(ornamentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(lineWidth, {
          toValue: 80,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
      // 3. Tagline fades in
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      // 4. Hold
      Animated.delay(900),
      // 5. Fade out whole screen
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 550,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      {/* Background texture dots */}
      <View style={styles.dotGrid} pointerEvents="none">
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>

      <View style={styles.center}>
        {/* Top ornament */}
        <Animated.Text style={[styles.topOrnament, { opacity: ornamentOpacity }]}>
          ✦
        </Animated.Text>

        {/* Logo */}
        <Animated.Text
          style={[
            styles.logo,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          QuickBihar
        </Animated.Text>

        {/* Expanding line with center diamond */}
        <View style={styles.lineRow}>
          <Animated.View style={[styles.line, { width: lineWidth }]} />
          <Animated.Text style={[styles.diamond, { opacity: ornamentOpacity }]}>
            ◆
          </Animated.Text>
          <Animated.View style={[styles.line, { width: lineWidth }]} />
        </View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          PREMIUM INDIAN JEWELLERY
        </Animated.Text>
      </View>

      {/* Bottom mark */}
      <Animated.View style={[styles.bottom, { opacity: tagOpacity }]}>
        <Text style={styles.bottomText}>Hallmark Certified · Made in India</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#1C3A2F",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  dotGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 28,
    opacity: 0.06,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#B8924A",
  },
  center: {
    alignItems: "center",
    gap: 14,
  },
  topOrnament: {
    fontSize: 14,
    color: "#B8924A",
    marginBottom: 2,
  },
  logo: {
    fontSize: 32,
    letterSpacing: 10,
    color: "#B8924A",
    fontFamily: "CormorantGaramond_600SemiBold",
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  line: {
    height: 0.5,
    backgroundColor: "#B8924A",
    opacity: 0.6,
  },
  diamond: {
    fontSize: 6,
    color: "#B8924A",
  },
  tagline: {
    fontSize: 9,
    letterSpacing: 4,
    color: "rgba(184,146,74,0.75)",
    fontFamily: "DMSans_300Light",
    marginTop: 2,
  },
  bottom: {
    position: "absolute",
    bottom: 48,
  },
  bottomText: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "rgba(184,146,74,0.4)",
    fontFamily: "DMSans_300Light",
  },
});
