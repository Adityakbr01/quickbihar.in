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
      style={[
        styles.card,
        { backgroundColor: theme.background, borderColor: theme.border },
        card.comingSoon && styles.cardDisabled,
      ]}
      activeOpacity={card.comingSoon ? 1 : 0.7}
      disabled={card.comingSoon}
      onPress={handlePress}
    >
      <View style={[styles.iconContainer, { backgroundColor: card.color + "15" }]}>
        <HugeiconsIcon icon={card.icon} size={24} color={card.color} />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{card.title}</Text>
      <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
        {card.description}
      </Text>
      {card.comingSoon && (
        <View style={[styles.badge, { backgroundColor: theme.border }]}>
          <Text style={[styles.badgeText, { color: theme.secondaryText }]}>
            Coming soon
          </Text>
        </View>
      )}
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
  cardDisabled: {
    opacity: 0.5,
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
  badge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
