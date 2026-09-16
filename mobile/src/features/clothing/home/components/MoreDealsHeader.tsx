import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { CAMPAIGNS } from "../lib/dealsConfig";
import { BREAKPOINTS } from "@/src/utils/responsive";

export const MoreDealsHeader = ({
  theme,
  activeCampaign,
  setActiveCampaign,
}: any) => {
  const [internalActiveId, setInternalActiveId] = React.useState(
    CAMPAIGNS[0]?.id || "1",
  );

  const activeId = activeCampaign ?? internalActiveId;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;
  // ponytail: festive active gradient is brand candy (same both modes);
  // only the idle-cream card adapts so it doesn't glow on dark.
  const isDark = theme?.isDark ?? theme?.text === "#ffffff";
  const idleGradient = (isDark
    ? [theme?.tertiaryBackground || "#2c2c2e", theme?.secondaryBackground || "#1c1c1e"]
    : ["#FDF3D1", "#FFFEFA"]) as [string, string];

  const handlePress = (id: string) => {
    if (setActiveCampaign) {
      setActiveCampaign(id);
    }
    setInternalActiveId(id);
  };

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

  const list = CAMPAIGNS;

  const renderCard = (camp: (typeof CAMPAIGNS)[number], cardWidth?: number) => {
    const isActive = activeId === camp.id;
    const imageUri = typeof camp.image === "string" ? camp.image : undefined;
    return (
      <TouchableOpacity
        key={camp.id}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`View ${camp.title} Deals`}
        {...({ title: `Explore ${camp.title} Deals on QuickBihar` } as any)}
        onPress={() => handlePress(camp.id)}
      >
        <LinearGradient
          colors={isActive ? ["#F15E48", "#FDCE7F"] : idleGradient}
          style={[
            styles.campaignCard,
            isDesktop && desktopStyles.card,
            cardWidth ? { width: cardWidth } : null,
            isActive
              ? { borderColor: "#F15E48" }
              : { borderColor: isDark ? "rgba(222,132,16,0.45)" : "#DE8410" },
          ]}
        >
          <Text
            style={[
              styles.campaignTitle,
              isDesktop && desktopStyles.title,
              isActive
                ? { color: "#FFFFFF" }
                : { color: isDark ? "#F5B04C" : "#E08616" },
            ]}
            numberOfLines={2}
          >
            {formatTitle(camp.title)}
          </Text>
          <Image
            source={imageUri ? { uri: imageUri } : camp.image}
            style={[styles.campaignImage, isDesktop && desktopStyles.image]}
            contentFit="contain"
            alt={`${camp.title} Deals in Bihar`}
            accessibilityLabel={`${camp.title} campaign`}
            {...({ title: `${camp.title} | QuickBihar Deals` } as any)}
          />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (isDesktop) {
    return (
      <View style={[styles.container, { paddingBottom: 0, alignItems: "center" }]}>
        <Text
          accessibilityRole="header"
          aria-level={2}
          {...({ role: "heading" } as any)}
          style={[styles.headerText, desktopStyles.heading, { color: theme?.text || "#fff" }]}
        >
          Explore More Deals
        </Text>
        <Text style={[desktopStyles.sub, { color: theme?.secondaryText }]}>
          {"Curated festive picks from Bihar's top local stores"}
        </Text>
        <View style={desktopStyles.grid}>
          {list.map((camp) => renderCard(camp))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: 0 }]}>
      <Text
        accessibilityRole="header"
        aria-level={2}
        {...({ role: "heading" } as any)}
        style={[styles.headerText, { color: theme?.text || "#fff" }]}
      >
        Explore More Deals
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.campaignList}
      >
        {CAMPAIGNS.map((camp) => {
          const isActive = activeId === camp.id;
          const imageUri = typeof camp.image === "string" ? camp.image : undefined;
          return (
            <TouchableOpacity
              key={camp.id}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`View ${camp.title} Deals`}
              {...({ title: `Explore ${camp.title} Deals on QuickBihar` } as any)}
              onPress={() => handlePress(camp.id)}
            >
              <LinearGradient
                colors={
                  isActive ? ["#F15E48", "#FDCE7F"] : idleGradient
                }
                style={[
                  styles.campaignCard,
                  isActive
                    ? { borderColor: "#F15E48" }
                    : { borderColor: isDark ? "rgba(222,132,16,0.45)" : "#DE8410" },
                ]}
              >
                <Text
                  style={[
                    styles.campaignTitle,
                    isActive
                      ? { color: "#FFFFFF" }
                      : { color: isDark ? "#F5B04C" : "#E08616" },
                  ]}
                  numberOfLines={2}
                >
                  {formatTitle(camp.title)}
                </Text>
                <Image
                  source={
                    imageUri
                      ? { uri: imageUri }
                      : camp.image
                  }
                  style={styles.campaignImage}
                  contentFit="contain"
                  alt={`${camp.title} Deals in Bihar`}
                  accessibilityLabel={`${camp.title} campaign`}
                  {...({ title: `${camp.title} | QuickBihar Deals` } as any)}
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

// Desktop-only: 5-up festive grid. Never used on mobile.
const desktopStyles = StyleSheet.create({
  heading: { fontSize: 28, marginBottom: 6 },
  sub: { fontSize: 14, fontWeight: "500", marginBottom: 22 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    maxWidth: 1080,
  },
  card: { width: 196, height: 132, borderRadius: 18 },
  title: { fontSize: 16, lineHeight: 18 },
  image: { width: 120, height: 120, bottom: -28, right: 22 },
});

export default MoreDealsHeader;
