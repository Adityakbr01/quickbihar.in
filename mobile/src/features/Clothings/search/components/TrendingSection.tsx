import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

const fireLottie = require("@/assets/lottie/Fire.json");

interface TrendingSectionProps {
  trendingItems: string[];
  onSelect: (item: string) => void;
}

const TrendingSection = ({ trendingItems, onSelect }: TrendingSectionProps) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.lottieContainer}>
          <LottieView
            key={theme.text}
            source={fireLottie}
            autoPlay
            loop
            style={styles.fireLottie}
            renderMode="SOFTWARE"
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Trending Now</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {trendingItems.map((item, index) => (
          <Pressable
            key={item}
            style={[
              styles.chip,
              {
                backgroundColor: theme.tertiaryBackground,
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(item);
            }}
          >
            <Text style={[styles.chipText, { color: theme.text }]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  lottieContainer: {
    width: 24,
    height: 24,
    marginRight: 6,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  fireLottie: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: "pointer" } as any,
    }),
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default TrendingSection;
