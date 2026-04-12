import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

export type SortOption = "relevance" | "price_low" | "price_high" | "rating";

interface FilterBarProps {
  selectedSort: SortOption;
  onSortChange: (option: SortOption) => void;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Price: Low to High", value: "price_low" },
  { label: "Price: High to Low", value: "price_high" },
  { label: "Top Rated", value: "rating" },
];

const FilterBar = ({ selectedSort, onSortChange }: FilterBarProps) => {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {SORT_OPTIONS.map((option) => {
        const isActive = selectedSort === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSortChange(option.value);
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
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    maxHeight: 40,
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 16,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: "pointer" } as any,
    }),
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default FilterBar;
