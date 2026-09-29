import React from "react";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

export type SortOption = "relevance" | "price_low" | "price_high" | "rating" | "newest";

export interface SearchFilters {
  category?: string;
  subCategory?: string;
  categoryId?: string;
  categoryName?: string;
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
    <button
      key={label}
      type="button"
      onClick={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="flex h-8 cursor-pointer items-center justify-center rounded-2xl border px-4"
      style={{
        backgroundColor: isActive ? theme.primary : theme.tertiaryBackground,
        borderColor: isActive ? theme.primary : theme.border,
      }}
    >
      <span
        className="text-xs font-semibold"
        style={{ color: isActive ? "#ffffff" : theme.text }}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div className="pb-2">
      {/* Sort Options */}
      <div className="my-1.5 max-h-10 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-row items-center gap-2 px-4">
          {SORT_OPTIONS.map((option) =>
            renderChip(option.label, selectedSort === option.value, () => onSortChange(option.value))
          )}
        </div>
      </div>

      {/* Gender (Client side constants) */}
      <div className="my-1.5 max-h-10 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-row items-center gap-2 px-4">
          <span className="mr-1 text-xs font-bold tracking-wide uppercase" style={{ color: theme.secondaryText }}>Gender:</span>
          {GENDERS.map((g) =>
            renderChip(g, filters.gender === g, () => onFilterChange({ ...filters, gender: filters.gender === g ? undefined : g }))
          )}
        </div>
      </div>

      {/* Price Ranges */}
      <div className="my-1.5 max-h-10 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-row items-center gap-2 px-4">
          <span className="mr-1 text-xs font-bold tracking-wide uppercase" style={{ color: theme.secondaryText }}>Price:</span>
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
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
