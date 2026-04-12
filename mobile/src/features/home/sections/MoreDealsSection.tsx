import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { spacing } from "@/src/theme/spacing";
import { createMoreDealsSectionStyles } from "../style/MoreDealsSection.style";
import {
  CAMPAIGNS,
  FILTERS,
  DEAL_PRODUCTS,
  CATEGORY_OPTIONS,
  GENDER_OPTIONS,
} from "../lib/dealsMockData";
import { DealProductCard } from "../components/DealProductCard";
import { FilterBottomSheet } from "../components/FilterBottomSheet";
import { HugeiconsIcon } from "@hugeicons/react-native";

export const useMoreDealsLogic = () => {
  const theme = useTheme() as any;
  const { width } = useWindowDimensions();
  const styles = React.useMemo(
    () => createMoreDealsSectionStyles(theme),
    [theme],
  );

  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [activeDropdownType, setActiveDropdownType] = useState<
    "Gender" | "Categories" | null
  >(null);

  const [selectedGenderOptions, setSelectedGenderOptions] = useState<string[]>(
    [],
  );
  const [selectedCategoryOptions, setSelectedCategoryOptions] = useState<
    string[]
  >([]);

  const handleApply = (selected: string[]) => {
    if (activeDropdownType === "Gender") {
      setSelectedGenderOptions(selected);
    } else if (activeDropdownType === "Categories") {
      setSelectedCategoryOptions(selected);
    }
  };

  const currentOptionsList =
    activeDropdownType === "Gender" ? GENDER_OPTIONS : CATEGORY_OPTIONS;

  // 2 columns with dynamic width
  const cardWidth = (width - spacing.md * 2 - spacing.sm) / 2;

  return {
    theme,
    width,
    styles,
    activeFilter,
    setActiveFilter,
    dropdownVisible,
    setDropdownVisible,
    activeDropdownType,
    setActiveDropdownType,
    selectedGenderOptions,
    selectedCategoryOptions,
    handleApply,
    currentOptionsList,
    cardWidth,
  };
};

export const MoreDealsFilters = ({
  theme,
  styles,
  activeFilter,
  setActiveFilter,
  setActiveDropdownType,
  setDropdownVisible,
}: any) => (
  <View
    style={[
      styles.filterWrapper,
      {
        backgroundColor: theme.background,
        paddingVertical: 12,
        zIndex: 10,
      },
    ]}
  >
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterList}
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter.title === filter.title;
        const isDropdown =
          filter.title === "Gender" || filter.title === "Categories";

        return (
          <TouchableOpacity
            key={filter.title}
            onPress={() => {
              setActiveFilter(filter);
              if (isDropdown) {
                setActiveDropdownType(filter.title as "Gender" | "Categories");
                setDropdownVisible(true);
              }
            }}
            style={[
              styles.filterPill,
              {
                borderColor: isActive ? theme.primary : theme.border,
                backgroundColor: isActive ? theme.primary : theme.background,
              },
            ]}
          >
            {filter.icon && (
              <HugeiconsIcon
                icon={filter.icon as any}
                size={14}
                color={isActive ? "#fff" : theme.iconColor}
              />
            )}
            <Text
              style={[
                styles.filterText,
                { color: isActive ? "#fff" : theme.text },
              ]}
            >
              {filter.title}
            </Text>
            {isDropdown && (
              <Ionicons
                name="chevron-down"
                size={14}
                color={isActive ? "#fff" : theme.iconColor}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

export const MoreDealsGrid = ({
  styles,
  cardWidth,
  activeDropdownType,
  dropdownVisible,
  setDropdownVisible,
  currentOptionsList,
  selectedGenderOptions,
  selectedCategoryOptions,
  handleApply,
}: any) => (
  <View style={styles.productGrid}>
    {DEAL_PRODUCTS.map((product) => (
      <DealProductCard key={product.id} product={product} width={cardWidth} />
    ))}

    {/* Bottom Sheet Modal */}
    {activeDropdownType && (
      <FilterBottomSheet
        visible={dropdownVisible}
        onClose={() => setDropdownVisible(false)}
        title={activeDropdownType}
        options={currentOptionsList}
        initialSelected={
          activeDropdownType === "Gender"
            ? selectedGenderOptions
            : selectedCategoryOptions
        }
        onApply={handleApply}
      />
    )}
  </View>
);

// Fallback for legacy imports, though we are removing the default export entirely or replacing it with an error boundary
const MoreDealsSection = () => {
  return (
    <Text>
      Please use the destructured components for MoreDealsSection directly
    </Text>
  );
};
export default MoreDealsSection;
