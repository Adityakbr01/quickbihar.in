import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, InteractionManager, ActivityIndicator } from "react-native";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import HomeHeader from "@/src/features/clothing/home/components/HomeHeader";
import { Ionicons } from "@expo/vector-icons";

const MOCK_FOOD_ITEMS = [
  { id: "1", title: "Litti Chokha Special", category: "Bihari Delicacy", rating: "4.9", price: "₹120", icon: "fast-food-outline" },
  { id: "2", title: "Paneer Butter Masala", category: "North Indian", rating: "4.7", price: "₹240", icon: "pizza-outline" },
  { id: "3", title: "Sattu Paratha & Dahi", category: "Breakfast", rating: "4.8", price: "₹90", icon: "restaurant-outline" },
  { id: "4", title: "Special Chicken Biryani", category: "Biryani", rating: "4.9", price: "₹280", icon: "flame-outline" },
];

export const FoodHomeScreen = () => {
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
        <View style={[styles.banner, { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" }]}>
          <Ionicons name="fast-food" size={40} color="#E11D48" />
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: "#9F1239" }]}>Quick Bihar Food Market 🍔</Text>
            <Text style={[styles.bannerSub, { color: "#BE123C" }]}>Hot & fresh meals delivered in 20 mins</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Near You</Text>

        {!isReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#E11D48" />
          </View>
        ) : (
          <View style={styles.grid}>
            {MOCK_FOOD_ITEMS.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  { backgroundColor: theme.secondaryBackground, borderColor: theme.border },
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: "#FFE4E6" }]}>
                  <Ionicons name={item.icon as any} size={28} color="#E11D48" />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.cardCat, { color: theme.tertiaryText }]}>{item.category}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.price}>{item.price}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#EAB308" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
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
    color: "#E11D48",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
