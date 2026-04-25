import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles as s } from "../styles";

interface RatingBarProps {
  stars: number;
  count: number;
  total: number;
  theme: any;
}

export const RatingBar = ({ stars, count, total, theme }: RatingBarProps) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={s.ratingBarRow}>
      <Text style={[s.ratingBarLabel, { color: theme.secondaryText }]}>
        {stars}
      </Text>
      <Ionicons name="star" size={10} color="#F59E0B" />
      <View style={[s.ratingBarTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            s.ratingBarFill,
            {
              width: `${pct}%`,
              backgroundColor:
                stars >= 4 ? "#34C759" : stars >= 3 ? "#F59E0B" : "#FF3B30",
            },
          ]}
        />
      </View>
      <Text style={[s.ratingBarCount, { color: theme.tertiaryText }]}>
        {count}
      </Text>
    </View>
  );
};
