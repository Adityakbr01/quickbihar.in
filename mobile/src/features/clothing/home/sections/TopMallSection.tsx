import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import LottieView from "lottie-react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createTopMallSectionStyles } from "../style/TopMallSection.style";
import { MallCardSkeleton } from "../components/MallCardSkeleton";
import { MallCard } from "../components/MallCard";
import { getTopMallsRequest } from "../api/mall.api";

const fireLottie = require("@/assets/lottie/Fire.json");

const TopMallSection = () => {
  const theme = useTheme() as any;
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const styles = React.useMemo(
    () => createTopMallSectionStyles(theme),
    [theme],
  );
  const router = useRouter();

  const isWeb = windowWidth > 600;
  const cardWidth = isWeb ? 300 : 260;
  const gap = 16;
  const { data: topMalls, isLoading } = useQuery({
    queryKey: ["topMalls"],
    queryFn: getTopMallsRequest,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 8,
            gap,
          }}
        >
          {[1, 2, 3].map((key) => (
            <View key={key} style={{ width: cardWidth }}>
              <MallCardSkeleton />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const malls = topMalls || [];

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
                Platform.OS === "web" &&
                  ({
                    filter: theme.text === "#ffffff" ? "invert(1)" : "none",
                  } as any),
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
        <TouchableOpacity
          style={styles.seeAllBtn}
          onPress={() => router.push("/mall" as any)}
        >
          <Text style={styles.seeAll}>Explore All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
        snapToInterval={cardWidth + gap}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {malls.map((item: any, index: number) => (
          <View
            key={item.id}
            style={{
              width: cardWidth,
              marginRight: index === malls.length - 1 ? 0 : gap,
            }}
          >
            <MallCard mall={item} />
          </View>
        ))}
      </ScrollView>
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
