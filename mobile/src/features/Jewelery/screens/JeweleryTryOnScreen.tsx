import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";

import { useColors } from "../hooks/useColors";

/**
 * Virtual try-on placeholder. Live AR needs backend 3D models per product
 * (not served yet) — this screen honestly says "coming soon" instead of
 * rendering mock jewellery. Product pages hide the Try button until then.
 */
export const JeweleryTryOnScreen = () => {
  const colors = useColors();

  return (
    <SafeViewWrapper>
      <View style={[styles.root, { backgroundColor: colors.ivory }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
            <Feather name="x" size={22} color={colors.ink} />
          </Pressable>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" },
            ]}
          >
            Virtual Try-On
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={[styles.body, { backgroundColor: colors.pearl }]}>
          <View style={[styles.iconCircle, { borderColor: colors.gold }]}>
            <Feather name="camera" size={32} color={colors.gold} />
          </View>
          <Text
            style={[
              styles.title,
              { color: colors.ink, fontFamily: "CormorantGaramond_500Medium_Italic" },
            ]}
          >
            Coming soon.
          </Text>
          <Text
            style={[
              styles.sub,
              { color: colors.warmGray, fontFamily: "DMSans_300Light" },
            ]}
          >
            Live AR mirror is in the works. Meanwhile, every piece ships with
            free 30-day returns — try it at home, for real.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: pressed ? colors.goldLight : colors.gold },
            ]}
            onPress={() => router.push("/jewelery/collections" as any)}
          >
            <Text
              style={[
                styles.btnText,
                { color: colors.ivory, fontFamily: "DMSans_500Medium" },
              ]}
            >
              Browse Collections →
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, letterSpacing: 2 },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 32, lineHeight: 38, textAlign: "center" },
  sub: { fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 300 },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 2,
    marginTop: 10,
  },
  btnText: { fontSize: 12, letterSpacing: 1.5 },
});
