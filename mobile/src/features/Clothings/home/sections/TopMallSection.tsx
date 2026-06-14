import React from "react";
import { View, Text, TouchableOpacity, useWindowDimensions, StyleSheet, Platform } from "react-native";
import { FlashList } from "@shopify/flash-list";
import LottieView from "lottie-react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createTopMallSectionStyles } from "../style/TopMallSection.style";
import { MOCK_MALLS } from "../lib/mockData";
import { MallCard } from "../components/MallCard";
import { getTopMallsRequest } from "../api/mall.api";

const fireLottie = require("@/assets/lottie/Fire.json");

const TopMallSection = () => {
  const theme = useTheme() as any;
  const { width: windowWidth } = useWindowDimensions();
  const styles = React.useMemo(() => createTopMallSectionStyles(theme), [theme]);
  const router = useRouter();

  // Handle snapping and width logic
  const isWeb = windowWidth > 600;
  const cardWidth = isWeb ? 300 : 260;
  const gap = 16;
  const { data: topMalls, isLoading } = useQuery({
    queryKey: ["topMalls"],
    queryFn: getTopMallsRequest,
  });
  const malls = topMalls?.length ? topMalls : isLoading ? MOCK_MALLS.slice(0, 3) : [];

  if (!malls.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={localStyles.titleContainer}>
          <Text style={styles.title}>Top 10 Malls </Text>
          <View style={localStyles.lottieWrapper}>
            <LottieView
              key={theme.text}
              source={fireLottie}
              autoPlay
              loop
              resizeMode="contain"
              style={[
                localStyles.fireLottie,
                Platform.OS === 'web' && { filter: theme.text === '#ffffff' ? 'invert(1)' : 'none' } as any
              ]}
              colorFilters={[
                {
                  keypath: "**",
                  color: theme.text,
                },
              ]}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push("/mall" as any)}>
          <Text style={styles.seeAll}>Explore All</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={malls}
        renderItem={({ item }) => <MallCard mall={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={cardWidth + gap}
        decelerationRate="fast"
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  lottieWrapper: {
    width: 32,
    height: 32,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  fireLottie: {
    width: "100%",
    height: "100%",
  },
});

export default TopMallSection;
