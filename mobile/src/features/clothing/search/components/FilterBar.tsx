import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

export type SortOption = "relevance" | "price_low" | "price_high" | "rating" | "newest";

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  gender?: string; // Client side for now
}

interface FilterBarProps {
  selectedSort: SortOption;
  onSortChange: (option: SortOption) => void;
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_low" },
  { label: "Price: High to Low", value: "price_high" },
  { label: "Top Rated", value: "rating" },
];

const PRICE_RANGES = [
  { label: "Under ₹199", min: 0, max: 199 },
  { label: "₹200 - ₹499", min: 200, max: 499 },
  { label: "₹500 - ₹999", min: 500, max: 999 },
  { label: "₹1000+", min: 1000, max: 50000 },
];

const GENDERS = ["Men", "Women", "Kids", "Unisex"];

const FilterBar = ({ selectedSort, onSortChange, filters, onFilterChange }: FilterBarProps) => {
  const theme = useTheme();

  const renderChip = (label: string, isActive: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: isActive ? theme.primary : theme.tertiaryBackground,
          borderColor: isActive ? theme.primary : theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: isActive ? "#ffffff" : theme.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {SORT_OPTIONS.map((option) =>
          renderChip(option.label, selectedSort === option.value, () => onSortChange(option.value))
        )}
      </ScrollView>

      {/* Gender (Client side constants) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.rowLabel, { color: theme.secondaryText }]}>Gender:</Text>
        {GENDERS.map((g) =>
          renderChip(g, filters.gender === g, () => onFilterChange({ ...filters, gender: filters.gender === g ? undefined : g }))
        )}
      </ScrollView>

      {/* Price Ranges */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.rowLabel, { color: theme.secondaryText }]}>Price:</Text>
        {PRICE_RANGES.map((range) => {
          const isActive = filters.minPrice === range.min && filters.maxPrice === range.max;
          return renderChip(range.label, isActive, () => {
            if (isActive) {
              onFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined });
            } else {
              onFilterChange({ ...filters, minPrice: range.min, maxPrice: range.max });
            }
          });
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingBottom: 8,
  },
  container: {
    marginVertical: 6,
    maxHeight: 40,
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginRight: 4,
  },
  chip: {
    paddingHorizontal: 16,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: "pointer" } as any,
    }),
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default FilterBar;
