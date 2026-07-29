import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CAMPAIGNS } from "../lib/dealsMockData";

export const MoreDealsHeader = ({ theme }: any) => {
  const [activeId, setActiveId] = React.useState(CAMPAIGNS[0]?.id);

  const formatTitle = (title: string) => {
    const upper = title.toUpperCase();
    if (upper === "FOR YOU") return "FOR\nYOU";
    if (upper === "DEAL OF THE DAY") return "DEAL OF\nTHE DAY";

    // For other titles generally replace the middle space with a newline
    const words = upper.split(" ");
    if (words.length > 2) {
      const mid = Math.ceil(words.length / 2);
      return words.slice(0, mid).join(" ") + "\n" + words.slice(mid).join(" ");
    }
    return upper.split(" ").join("\n");
  };

  return (
    <View style={[styles.container, { paddingBottom: 0 }]}>
      <Text style={[styles.headerText, { color: theme.text }]}>
        Explore More Deals
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.campaignList}
      >
        {CAMPAIGNS.map((camp) => {
          const isActive = activeId === camp.id;
          return (
            <TouchableOpacity
              key={camp.id}
              activeOpacity={0.85}
              onPress={() => setActiveId(camp.id)}
            >
              <LinearGradient
                colors={
                  isActive ? ["#F15E48", "#FDCE7F"] : ["#FDF3D1", "#FFFEFA"]
                }
                style={[
                  styles.campaignCard,
                  isActive && { borderColor: "#F15E48" },
                ]}
              >
                <Text
                  style={[
                    styles.campaignTitle,
                    isActive && { color: "#FFFFFF" },
                  ]}
                  numberOfLines={2}
                >
                  {formatTitle(camp.title)}
                </Text>
                <Image
                  source={
                    typeof camp.image === "string"
                      ? { uri: camp.image }
                      : camp.image
                  }
                  style={styles.campaignImage}
                  resizeMode="contain"
                />
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingBottom: 24,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  campaignList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  campaignCard: {
    width: 120,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#FFF8E7",
    borderTopWidth: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "#DE8410",
    height: 100,
    padding: 8,
    position: "relative",
  },
  campaignImage: {
    position: "absolute",
    bottom: -20, // Let's sink the image down to make it look cool behind/under the text
    right: 16, // Push it to the corner
    width: 90,
    height: 90,
    zIndex: 11,
    opacity: 0.8,
  },
  campaignTitle: {
    fontSize: 17,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 6,
    lineHeight: 16,
    color: "#E08616",
    textAlign: "center",
    zIndex: 10,
  },
});
