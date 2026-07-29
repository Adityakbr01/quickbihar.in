import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, InteractionManager, ActivityIndicator } from "react-native";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import HomeHeader from "@/src/features/clothing/home/components/HomeHeader";
import { Ionicons } from "@expo/vector-icons";

const MOCK_JEWELERY_ITEMS = [
  { id: "1", title: "22K Gold Traditional Necklace", category: "Gold Collection", price: "₹45,999", icon: "diamond-outline" },
  { id: "2", title: "Sterling Silver Diamond Ring", category: "Rings", price: "₹8,499", icon: "sparkles-outline" },
  { id: "3", title: "Kundan Bridal Jhumka Set", category: "Earrings", price: "₹12,999", icon: "flower-outline" },
  { id: "4", title: "Rose Gold Charm Bracelet", category: "Bracelets", price: "₹15,499", icon: "ribbon-outline" },
];

export const JeweleryHomeScreen = () => {
  const theme = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  return (
    <SafeViewWrapper>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.banner, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
          <Ionicons name="sparkles" size={40} color="#D97706" />
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: "#92400E" }]}>Royal Jewelry Collection 💎</Text>
            <Text style={[styles.bannerSub, { color: "#B45309" }]}>Certified hallmarked gold, silver & diamonds</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured Ornaments</Text>

        {!isReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#D97706" />
          </View>
        ) : (
          <View style={styles.grid}>
            {MOCK_JEWELERY_ITEMS.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  { backgroundColor: theme.secondaryBackground, borderColor: theme.border },
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name={item.icon as any} size={28} color="#D97706" />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.cardCat, { color: theme.tertiaryText }]}>{item.category}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.price}>{item.price}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  bannerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  iconContainer: {
    height: 90,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardCat: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: "#D97706",
  },
});
