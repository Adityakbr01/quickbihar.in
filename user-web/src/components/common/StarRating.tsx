import { Feather } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

interface StarRatingProps {
  /** Numeric rating (0–5). Rounded to nearest integer for filled stars. */
  rating: number;
  /** Icon size in px. Defaults to 10. */
  size?: number;
  /** Color for filled stars. */
  filledColor: string;
  /** Color for empty stars. */
  emptyColor: string;
}

/**
 * A simple 5-star rating row.
 *
 * ponytail: was defined inline (as a local `Stars` component) in
 * Jewelery/components/ProductCard.tsx AND JeweleryProductDetailScreen.tsx.
 * Use this shared version instead.
 */
export function StarRating({
  rating,
  size = 10,
  filledColor,
  emptyColor,
}: StarRatingProps) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather
          key={s}
          name="star"
          size={size}
          color={s <= Math.round(rating) ? filledColor : emptyColor}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}
