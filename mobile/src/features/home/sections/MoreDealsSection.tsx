import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { spacing } from "@/src/theme/spacing";
import { Ionicons } from "@expo/vector-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { NativeModulesProxy } from "expo-modules-core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { getCategoriesRequest } from "../../category/api/category.api";
import { getPublicProductsRequest } from "../../product/api/product.api";
import { DealProductCard } from "../components/DealProductCard";
import { DealProductSkeleton } from "../components/DealProductSkeleton";
import { FilterBottomSheet } from "../components/FilterBottomSheet";
import {
  CATEGORY_OPTIONS,
  FILTERS,
  GENDER_OPTIONS,
} from "../lib/dealsMockData";
import { createMoreDealsSectionStyles } from "../style/MoreDealsSection.style";

const getSpeechRecognitionModule = () => {
  if (!(NativeModulesProxy as any)?.ExpoSpeechRecognition) {
    return null;
  }

  try {
    const speech = require("expo-speech-recognition");
    return speech?.ExpoSpeechRecognitionModule ?? null;
  } catch {
    // Expo Go does not include this native module.
    return null;
  }
};

const useDebouncedValue = <T,>(value: T, delay = 500) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

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

  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim();
  const debouncedSearchQuery = useDebouncedValue(normalizedSearchQuery, 500);



  // Real-world search strategy:
  // - debounce user input
  // - wait for at least 2 characters before sending search param
  const effectiveSearchQuery =
    debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : "";

  // 1. Fetch Real Categories
  const { data: categories } = useQuery({
    queryKey: ["categories", "root"],
    queryFn: () => getCategoriesRequest(),
  });

  // Map categories for the BottomSheet options fallback to CATEGORY_OPTIONS
  const categoryOptions = React.useMemo(() => {
    if (!categories || categories.length === 0) return CATEGORY_OPTIONS;
    return categories.map((cat) => ({
      id: cat._id,
      title: cat.name,
    }));
  }, [categories]);

  // 2. Fetch Paginated Products
  const {
    data: productData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [
      "paginatedProducts",
      selectedCategoryOptions,
      effectiveSearchQuery,
      activeFilter.title,
    ],
    queryFn: ({ pageParam = 1 }) => {
      const params: any = {
        page: pageParam,
        limit: 10,
        category:
          selectedCategoryOptions.length > 0
            ? selectedCategoryOptions[0]
            : undefined,
        search: effectiveSearchQuery || undefined,
      };

      // Map UI filters to Server params
      if (activeFilter.title === "Trending") params.isTrending = true;
      if (activeFilter.title === "New Arrival") params.isNewArrival = true;
      if (activeFilter.title === "Most Popular") params.isFeatured = true;

      return getPublicProductsRequest(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || typeof lastPage.total === "undefined") return undefined;
      const currentLoaded = allPages.length * 10;
      return currentLoaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allProducts = React.useMemo(() => {
    return productData?.pages.flatMap((page) => page?.data || []) || [];
  }, [productData]);

  const handleApply = (selected: string[]) => {
    if (activeDropdownType === "Gender") {
      setSelectedGenderOptions(selected);
    } else if (activeDropdownType === "Categories") {
      setSelectedCategoryOptions(selected);
    }
  };

  const currentOptionsList =
    activeDropdownType === "Gender" ? GENDER_OPTIONS : categoryOptions;

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
    allProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    searchQuery,
    setSearchQuery,
  };
};

export const MoreDealsFilters = ({
  theme,
  styles,
  activeFilter,
  setActiveFilter,
  setActiveDropdownType,
  setDropdownVisible,
  searchQuery,
  setSearchQuery,
}: any) => {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speechModule = useMemo(() => getSpeechRecognitionModule(), []);
  const isSpeechModuleAvailable = !!speechModule;

  useEffect(() => {
    if (!speechModule?.addListener) {
      return;
    }

    const startSub = speechModule.addListener("start", () => {
      setIsListening(true);
      setSpeechError(null);
    });

    const endSub = speechModule.addListener("end", () => {
      setIsListening(false);
    });

    const resultSub = speechModule.addListener("result", (event: any) => {
      const transcript = event?.results?.[0]?.transcript?.trim();
      if (transcript) {
        setSearchQuery(transcript);
      }
    });

    const errorSub = speechModule.addListener("error", (event: any) => {
      setIsListening(false);
      setSpeechError(
        event?.message || "Voice search is unavailable right now.",
      );
    });

    return () => {
      startSub?.remove?.();
      endSub?.remove?.();
      resultSub?.remove?.();
      errorSub?.remove?.();
    };
  }, [setSearchQuery, speechModule]);

  const handleMicPress = useCallback(async () => {
    setSpeechError(null);

    if (!speechModule) {
      return;
    }

    if (!speechModule.isRecognitionAvailable?.()) {
      return;
    }

    if (isListening) {
      speechModule.stop?.();
      return;
    }

    try {
      const permission = await speechModule.requestPermissionsAsync?.();
      if (!permission.granted) {
        setSpeechError("Microphone permission is required for voice search.");
        return;
      }

      speechModule.start?.({
        lang: "en-IN",
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        iosTaskHint: "search",
      });
    } catch {
      setSpeechError("Could not start voice search.");
    }
  }, [isListening, speechModule]);

  return (
    <View
      style={[
        styles.filterWrapper,
        {
          backgroundColor: theme.background,
          paddingBottom: 12,
          zIndex: 10,
        },
      ]}
    >
      {/* iOS + Swiggy style search bar */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          marginBottom: 18,
          marginTop: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.secondaryBackground,
            borderRadius: 50,
            paddingHorizontal: 16,
            paddingVertical: Platform.OS === "ios" ? 12 : 6,
            borderWidth: 1,
            borderColor: searchQuery ? theme.primary : theme.border,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: searchQuery ? 0.16 : 0.08,
            shadowRadius: 10,
            elevation: searchQuery ? 4 : 2,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: theme.tertiaryBackground,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Ionicons
              name="search"
              size={17}
              color={searchQuery ? theme.primary : theme.secondaryText}
            />
          </View>

          <TextInput
            placeholder="Search products, brands..."
            placeholderTextColor={theme.tertiaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
            style={{
              flex: 1,
              color: theme.text,
              fontSize: 16,
              fontWeight: "500",
              letterSpacing: -0.2,
            }}
            selectionColor={theme.primary}
            clearButtonMode="while-editing"
          />

          {searchQuery.length > 0 && Platform.OS !== "ios" ? (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={{ padding: 4, marginRight: 4 }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.secondaryText}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handleMicPress}
            activeOpacity={0.8}
            disabled={!isSpeechModuleAvailable}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isListening ? theme.primary : "transparent",
              opacity: isSpeechModuleAvailable ? 1 : 0.5,
            }}
          >
            <Ionicons
              name={isListening ? "mic" : "mic-outline"}
              size={18}
              color={isListening ? "#fff" : theme.tertiaryText}
            />
          </TouchableOpacity>
        </View>

        {/* Active Search Hint */}
        {searchQuery.length > 0 && (
          <View
            style={{
              marginTop: 10,
              paddingHorizontal: 6,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="flash-outline" size={13} color={theme.primary} />
            <Text
              style={{
                marginLeft: 6,
                fontSize: 12,
                color: theme.secondaryText,
                fontWeight: "500",
              }}
            >
              Showing results for{" "}
              <Text style={{ color: theme.primary, fontWeight: "700" }}>
                "{searchQuery}"
              </Text>
            </Text>
          </View>
        )}

        {speechError ? (
          <Text
            style={{
              marginTop: 8,
              marginLeft: 6,
              color: theme.error,
              fontSize: 12,
              fontWeight: "500",
            }}
          >
            {speechError}
          </Text>
        ) : null}
      </View>

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
                  setActiveDropdownType(
                    filter.title as "Gender" | "Categories",
                  );
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
};

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
  allProducts,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  theme,
}: any) => (
  <View style={styles.productGrid}>
    {isLoading && !allProducts.length ? (
      // Render a grid of skeletons while loading initial data
      [1, 2, 3, 4, 5, 6].map((key) => (
        <DealProductSkeleton key={key} width={cardWidth} />
      ))
    ) : allProducts.length > 0 ? (
      allProducts.map((product: any) => (
        <DealProductCard
          key={product._id}
          product={product}
          width={cardWidth}
        />
      ))
    ) : (
      <View
        style={{ width: "100%", paddingVertical: 60, alignItems: "center" }}
      >
        <Ionicons name="search-outline" size={48} color={theme.tertiaryText} />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: theme.secondaryText,
            fontWeight: "600",
          }}
        >
          No products found
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: theme.tertiaryText,
            textAlign: "center",
            paddingHorizontal: 40,
          }}
        >
          Try adjusting your search or filters to find what you're looking for.
        </Text>
      </View>
    )}

    {hasNextPage && (
      <TouchableOpacity
        onPress={() => fetchNextPage()}
        disabled={isFetchingNextPage}
        style={{ width: "100%", padding: 20, alignItems: "center" }}
      >
        {isFetchingNextPage ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <Text style={{ color: theme.primary, fontWeight: "600" }}>
            Load More
          </Text>
        )}
      </TouchableOpacity>
    )}

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

// Fallback for legacy imports
const MoreDealsSection = () => {
  return (
    <Text>
      Please use the destructured components for MoreDealsSection directly
    </Text>
  );
};

export default MoreDealsSection;
