import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Collection } from "@/src/features/Jewelery/data/collections";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

const { width } = Dimensions.get("window");

interface CollectionCardProps {
  collection: Collection;
  large?: boolean;
  style?: object;
}

export function CollectionCard({
  collection,
  large = false,
  style,
}: CollectionCardProps) {
  const colors = useColors();

  const handlePress = () => {
    router.push("/jewelery/collections" as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        large ? styles.large : styles.small,
        { opacity: pressed ? 0.92 : 1 },
        style,
      ]}
    >
      <Image
        source={collection.image}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            {
              color: "#F7F3EC",
              fontFamily: "CormorantGaramond_500Medium_Italic",
              fontSize: large ? 26 : 20,
            },
          ]}
        >
          {collection.name}
        </Text>
        <Text
          style={[
            styles.count,
            { color: "rgba(247,243,236,0.7)", fontFamily: "DMSans_400Regular" },
          ]}
        >
          {collection.pieceCount} pieces
        </Text>
        <View
          style={[styles.exploreRow]}
        >
          <Text
            style={[
              styles.explore,
              { color: "#D4A85A", fontFamily: "DMSans_400Regular" },
            ]}
          >
            Explore →
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  large: {
    height: 320,
  },
  small: {
    height: 152,
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(26,22,20,0.28)",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 2,
  },
  name: {
    lineHeight: 30,
  },
  count: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  exploreRow: {
    marginTop: 4,
  },
  explore: {
    fontSize: 11,
    letterSpacing: 1,
  },
});
