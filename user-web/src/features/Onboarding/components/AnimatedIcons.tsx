import React from "react";
import { View, StyleSheet } from "react-native";
import { Gradient } from "@/src/components/common/Gradient";
import { ShoppingBag } from "lucide-react";

// ─── SHOPPING BAG ICON (Pendulum Sway + Harmonic Levitation) ────────────────────
export const ShoppingBagIcon = () => {
  // CSS keyframe loops (see index.css) replace the reanimated shared values:
  // float + rock, shadow pulse, twinkling spinning stars.
  const bagStyle = {
    animation: "qb-bag 4.8s ease-in-out infinite",
  };

  const shadowStyle = {
    animation: "qb-bag-shadow 4.8s ease-in-out infinite",
  };

  const star1Style = {
    animation: "qb-twinkle-spin 3s ease-in-out infinite",
  };

  const star2Style = {
    animation: "qb-twinkle-spin-rev 4s ease-in-out 1s infinite",
  };

  return (
    <View style={iconStyles.container}>
      <View style={[iconStyles.shadow, shadowStyle]} />
      <View style={[bagStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{
          shadowColor: "#fff",
          shadowOpacity: 0.6,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
        }}>
          <ShoppingBag size={120} color="rgba(255,255,255,0.95)" />
        </View>
      </View>
      <View style={[iconStyles.star1, star1Style]} />
      <View style={[iconStyles.star2, star2Style]} />
    </View>
  );
};

// ─── CREDIT CARD ICON (Gyroscopic Float + Tap Impact + Hologram) ───────────────────
export const CreditCardIcon = () => {
  // CSS keyframe loops (see index.css): card bob, shadow pulse,
  // holographic sweep, NFC waves.
  const cardStyle = {
    animation: "qb-card-bob 4s ease-in-out infinite",
  };

  const shimmerStyle = {
    animation: "qb-shimmer 6s ease-in-out infinite",
  };

  const shadowStyle = {
    animation: "qb-card-shadow 4s ease-in-out infinite",
  };

  const wave1Style = {
    animation: "qb-wave 2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
  };

  const wave2Style = {
    animation: "qb-wave 2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s infinite",
  };

  return (
    <View style={iconStyles.container}>
      <View style={[iconStyles.shadow, { bottom: 10, width: 90 }, shadowStyle]} />
      <View style={cardStyle}>
        <View style={iconStyles.card}>
          <Gradient colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.05)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={iconStyles.cardStrip} />
          {/* Holographic sweeping line */}
          <View style={[StyleSheet.absoluteFill, shimmerStyle]}>
            <Gradient colors={["transparent", "rgba(255,255,255,0.8)", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { width: 40, transform: "skewX(-20deg)" }]}
            />
          </View>
          <View style={iconStyles.chip}>
            <Gradient colors={["#fcd34d", "#b45309"]} style={StyleSheet.absoluteFill} />
          </View>
        </View>
      </View>
      <View style={[iconStyles.nfcWave, iconStyles.nfcWave1, wave1Style]} />
      <View style={[iconStyles.nfcWave, iconStyles.nfcWave2, wave2Style]} />
    </View>
  );
};

// ─── TRUCK ICON (Suspension Bounce + Wheel Spin + Speed Streaks) ────────────────────
export const TruckIcon = () => {
  // CSS keyframe loops (see index.css): body bounce, spinning wheels,
  // shadow pulse, speed streaks.
  const truckStyle = {
    animation: "qb-truck 1.4s ease-in-out infinite",
  };

  const wheelStyle = {
    animation: "qb-spin-rev 0.4s linear infinite",
  };

  const shadowStyle = {
    animation: "qb-truck-shadow 1.4s ease-in-out infinite",
  };

  const s1 = { animation: "qb-streak 0.6s linear infinite" };
  const s2 = { animation: "qb-streak 0.46s linear 0.1s infinite" };
  const s3 = { animation: "qb-streak 0.75s linear 0.2s infinite" };
  const particle = { animation: "qb-streak 0.4s linear 0.05s infinite" };

  return (
    <View style={iconStyles.container}>
      <View style={[iconStyles.speedLine, iconStyles.speedLine1, s1]} />
      <View style={[iconStyles.speedLine, iconStyles.speedLine2, s2]} />
      <View style={[iconStyles.speedLine, iconStyles.speedLine3, s3]} />
      <View style={[iconStyles.particle, particle]} />

      <View style={[iconStyles.shadow, { bottom: 26, width: 100 }, shadowStyle]} />

      <View style={truckStyle}>
        <View style={iconStyles.truckBody}>
          <Gradient colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.05)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={iconStyles.truckCabin}>
            <Gradient colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0.1)"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={iconStyles.truckWindow} />
          </View>
        </View>
        <View style={iconStyles.wheelsRow}>
          <View style={[iconStyles.wheel, wheelStyle]}>
            <View style={iconStyles.spoke} />
            <View style={[iconStyles.spoke, { transform: [{ rotate: "90deg" }] }]} />
            <View style={iconStyles.wheelHub} />
          </View>
          <View style={{ flex: 1 }} />
          <View style={[iconStyles.wheel, wheelStyle]}>
            <View style={iconStyles.spoke} />
            <View style={[iconStyles.spoke, { transform: [{ rotate: "90deg" }] }]} />
            <View style={iconStyles.wheelHub} />
          </View>
        </View>
      </View>
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