import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useRouter } from "expo-router";
import type { AdminCardItem } from "../lib/adminData";

interface AdminStatCardProps {
  card: AdminCardItem;
}

const AdminStatCard = ({ card }: AdminStatCardProps) => {
  const theme = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (card.route) {
      router.push(card.route as any);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <View style={[styles.iconContainer, { backgroundColor: card.color + "15" }]}>
        <HugeiconsIcon icon={card.icon} size={24} color={card.color} />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{card.title}</Text>
      <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
        {card.description}
      </Text>
    </TouchableOpacity>
  );
};

export default AdminStatCard;

const styles = StyleSheet.create({
  card: {
    width: "48%",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
