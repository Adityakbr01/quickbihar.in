import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// ─── SHOPPING BAG ICON (Pendulum Sway + Harmonic Levitation) ────────────────────
export const ShoppingBagIcon = () => {
  const floatY = useSharedValue(0);
  const rockZ = useSharedValue(0);
  const star1 = useSharedValue(0);
  const star2 = useSharedValue(0);

  useEffect(() => {
    // Harmonic floating (Easting.sin is physically accurate for hovering)
    floatY.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Natural pendulum rocking momentum caused by levitation
    rockZ.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-4, { duration: 3200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    star1.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);
    star2.value = withDelay(
      1000,
      withRepeat(withTiming(1, { duration: 4000 }), -1, false)
    );
  }, [floatY, rockZ, star1, star2]);

  const bagStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotateZ: `${rockZ.value}deg` },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    // Shadow shrinks quadratically as bag rises higher
    transform: [
      { scale: interpolate(floatY.value, [-18, 0], [0.4, 1.2]) },
    ],
    opacity: interpolate(floatY.value, [-18, 0], [0.1, 0.45]),
  }));

  const star1Style = useAnimatedStyle(() => ({
    opacity: interpolate(star1.value, [0, 0.5, 1], [0.2, 1, 0.2]),
    transform: [
      { scale: interpolate(star1.value, [0, 0.5, 1], [0.5, 1.3, 0.5]) },
      { rotate: `${interpolate(star1.value, [0, 1], [0, 360])}deg` },
    ],
  }));

  const star2Style = useAnimatedStyle(() => ({
    opacity: interpolate(star2.value, [0, 0.5, 1], [0.2, 1, 0.2]),
    transform: [
      { scale: interpolate(star2.value, [0, 0.5, 1], [0.5, 1.3, 0.5]) },
      { rotate: `${interpolate(star2.value, [0, 1], [360, 0])}deg` },
    ],
  }));

  return (
    <View style={iconStyles.container}>
      <Animated.View style={[iconStyles.shadow, shadowStyle]} />
      <Animated.View style={[bagStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{
          shadowColor: "#fff",
          shadowOpacity: 0.6,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
        }}>
          <Ionicons name="bag-outline" size={120} color="rgba(255,255,255,0.95)" />
        </View>
      </Animated.View>
      <Animated.View style={[iconStyles.star1, star1Style]} />
      <Animated.View style={[iconStyles.star2, star2Style]} />
    </View>
  );
};

// ─── CREDIT CARD ICON (3D Gyroscopic Float + Spring Impact + Hologram) ──────────
export const CreditCardIcon = () => {
  const hoverX = useSharedValue(0);
  const hoverY = useSharedValue(0);
  const tapPhase = useSharedValue(0);
  const holoShine = useSharedValue(0);
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);

  useEffect(() => {
    // Continuous 3D drifting
    hoverX.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-15, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    hoverY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(10, { duration: 4000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Snappy physical tap with spring rebound
    tapPhase.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), // Approach
        withSpring(2, { damping: 10, stiffness: 400 }), // Impact hard
        withSpring(0, { damping: 14, stiffness: 100 })  // Rebound float
      ),
      -1,
      false
    );

    // Holographic shimmer sweeping across the card
    holoShine.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    wave1.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) }), -1, false);
    wave2.value = withDelay(
      600,
      withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) }), -1, false)
    );
  }, [hoverX, hoverY, tapPhase, holoShine, wave1, wave2]);

  const cardStyle = useAnimatedStyle(() => {
    // tapPhase: 0=float, 1=ready to tap, 2=impact
    const translateY = interpolate(tapPhase.value, [0, 1, 2], [0, 8, 22]);
    const rotateX = hoverX.value + interpolate(tapPhase.value, [0, 1, 2], [0, -15, 0]);
    const rotateY = hoverY.value;
    const rotateZ = interpolate(tapPhase.value, [0, 1, 2], [0, -4, 2]);

    return {
      transform: [
        { perspective: 800 },
        { translateY },
        { rotateX: `${rotateX}deg` },
        { rotateY: `${rotateY}deg` },
        { rotateZ: `${rotateZ}deg` },
      ],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(holoShine.value, [0, 1], [-120, 120]) }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(tapPhase.value, [0, 2], [1.3, 0.7]) }],
    opacity: interpolate(tapPhase.value, [0, 2], [0.15, 0.6]),
  }));

  const useMakeWaveStyle = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: interpolate(sv.value, [0, 0.2, 1], [0, 0.9, 0]),
      transform: [{ scale: interpolate(sv.value, [0, 1], [0.5, 1.8]) }],
    }));

  const wave1Style = useMakeWaveStyle(wave1);
  const wave2Style = useMakeWaveStyle(wave2);

  return (
    <View style={iconStyles.container}>
      <Animated.View style={[iconStyles.shadow, { bottom: 10, width: 90 }, shadowStyle]} />
      <Animated.View style={cardStyle}>
        <View style={iconStyles.card}>
          <LinearGradient
            colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.05)"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={iconStyles.cardStrip} />
          {/* Holographic sweeping line */}
          <Animated.View style={[StyleSheet.absoluteFillObject, shimmerStyle]}>
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.8)", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFillObject, { width: 40, transform: [{ skewX: "-20deg" }] }]}
            />
          </Animated.View>
          <View style={iconStyles.chip}>
            <LinearGradient colors={["#fcd34d", "#b45309"]} style={StyleSheet.absoluteFillObject} />
          </View>
        </View>
      </Animated.View>
      <Animated.View style={[iconStyles.nfcWave, iconStyles.nfcWave1, wave1Style]} />
      <Animated.View style={[iconStyles.nfcWave, iconStyles.nfcWave2, wave2Style]} />
    </View>
  );
};

// ─── TRUCK ICON (Suspension Pitching + Heavy Springs + Particles) ──────────────
export const TruckIcon = () => {
  const bounceY = useSharedValue(0);
  const pitchZ = useSharedValue(0);
  const wheelSpin = useSharedValue(0);
  const speedX = useSharedValue(0);

  useEffect(() => {
    // Heavy suspension landing using sharp decel and bounce
    bounceY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 150, easing: Easing.out(Easing.cubic) }), // Fly up a bump
        withSpring(0, { damping: 4, stiffness: 200 }), // Crash down heavy
        withDelay(400, withTiming(0, { duration: 0 })) // Cruise flat
      ),
      -1,
      false
    );

    // Acceleration momentum pitch (tilting back and snapping forward)
    pitchZ.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 400, easing: Easing.inOut(Easing.quad) }), // Accelerate tilt
        withSpring(-2, { damping: 8, stiffness: 120 }), // Brake/Shift gear tilt
        withSpring(0, { damping: 6, stiffness: 80 }) // Settle
      ),
      -1,
      false
    );

    // Extreme continuous wheel spin
    wheelSpin.value = withRepeat(withTiming(360, { duration: 400, easing: Easing.linear }), -1, false);

    // Particle wind/speed streaks
    speedX.value = withRepeat(
      withTiming(1, { duration: 600, easing: Easing.linear }),
      -1,
      false
    );
  }, [bounceY, pitchZ, wheelSpin, speedX]);

  const truckStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounceY.value },
      { rotateZ: `${pitchZ.value}deg` },
    ],
  }));

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `-${wheelSpin.value}deg` }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(bounceY.value, [-6, 0], [0.85, 1.1]) },
      { translateX: interpolate(pitchZ.value, [-2, 4], [2, -2]) }, // Shadow slides slightly on tilt
    ],
    opacity: interpolate(bounceY.value, [-6, 0], [0.2, 0.5]),
  }));

  const useStreakStyle = (offset: number, speedMultiplier: number) =>
    useAnimatedStyle(() => {
      const val = (speedX.value * speedMultiplier + offset) % 1;
      return {
        transform: [{ translateX: interpolate(val, [0, 1], [40, -100]) }],
        opacity: interpolate(val, [0, 0.1, 0.8, 1], [0, 0.8, 0.8, 0]),
      };
    });

  const s1 = useStreakStyle(0, 1);
  const s2 = useStreakStyle(0.4, 1.3);
  const s3 = useStreakStyle(0.8, 0.8);
  const particle = useStreakStyle(0.2, 1.5); // Fast gravel piece

  return (
    <View style={iconStyles.container}>
      <Animated.View style={[iconStyles.speedLine, iconStyles.speedLine1, s1]} />
      <Animated.View style={[iconStyles.speedLine, iconStyles.speedLine2, s2]} />
      <Animated.View style={[iconStyles.speedLine, iconStyles.speedLine3, s3]} />
      <Animated.View style={[iconStyles.particle, particle]} />

      <Animated.View style={[iconStyles.shadow, { bottom: 26, width: 100 }, shadowStyle]} />

      <Animated.View style={truckStyle}>
        <View style={iconStyles.truckBody}>
          <LinearGradient
            colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.05)"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={iconStyles.truckCabin}>
            <LinearGradient
              colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0.1)"]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={iconStyles.truckWindow} />
          </View>
        </View>
        <View style={iconStyles.wheelsRow}>
          <Animated.View style={[iconStyles.wheel, wheelStyle]}>
            <View style={iconStyles.spoke} />
            <View style={[iconStyles.spoke, { transform: [{ rotate: "90deg" }] }]} />
            <View style={iconStyles.wheelHub} />
          </Animated.View>
          <View style={{ flex: 1 }} />
          <Animated.View style={[iconStyles.wheel, wheelStyle]}>
            <View style={iconStyles.spoke} />
            <View style={[iconStyles.spoke, { transform: [{ rotate: "90deg" }] }]} />
            <View style={iconStyles.wheelHub} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const iconStyles = StyleSheet.create({
  container: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: {
    position: "absolute",
    bottom: 12,
    width: 65,
    height: 12,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
    transform: [{ scaleY: 0.5 }],
  },
  bagBody: {
    width: 78,
    height: 82,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 16,
    overflow: "hidden",
  },
  bagHandle: {
    position: "absolute",
    top: -24,
    width: 40,
    height: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.95)",
    borderBottomWidth: 0,
    zIndex: -1,
  },
  bagStripe: {
    width: 46,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 1.5,
  },
  star1: {
    position: "absolute",
    top: 10,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: "#ffffff",
    shadowColor: "#fff",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  star2: {
    position: "absolute",
    bottom: 22,
    left: 4,
    width: 12,
    height: 12,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  card: {
    width: 108,
    height: 70,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  cardStrip: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  chip: {
    position: "absolute",
    bottom: 14,
    left: 14,
    width: 22,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#fcd34d",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    overflow: "hidden",
  },
  nfcWave: {
    position: "absolute",
    top: 0,
    right: 6,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.8)",
  },
  nfcWave1: {},
  nfcWave2: { width: 40, height: 40, borderRadius: 20, top: 8, right: 14 },
  truckBody: {
    width: 114,
    height: 60,
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    overflow: "hidden",
  },
  truckCabin: {
    width: 40,
    height: "100%",
    borderLeftWidth: 1.5,
    borderLeftColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
    marginLeft: "auto",
    overflow: "hidden",
  },
  truckWindow: {
    width: 22,
    height: 20,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
  },
  wheelsRow: {
    flexDirection: "row",
    marginTop: 0, // Lifted tightly to chassis
    paddingHorizontal: 12,
  },
  wheel: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0f172a",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  spoke: {
    position: "absolute",
    width: 26,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  wheelHub: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  speedLine: {
    position: "absolute",
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  speedLine1: { width: 40, top: 60, left: 0 },
  speedLine2: { width: 56, top: 70, left: -6 },
  speedLine3: { width: 32, top: 80, left: 8 },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    top: 90,
    left: 20,
  },
});