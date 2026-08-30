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
import {
  Shirt01Icon,
  GlassesIcon,
  SparklesIcon,
  ManIcon,
  WomanIcon,
  KidIcon,
  ShoppingBag01Icon,
  ShortsPantsIcon,
  HoodieIcon,
  HangerIcon,
  SandalsIcon,
  Kurta01Icon,
} from "@hugeicons/core-free-icons";
import { getPublicCategoriesRequest } from "@/src/features/common/category/api/category.api";
import { getPublicProductsRequest } from "../../product/api/product.api";
import { DealProductCard } from "../components/DealProductCard";
import { DealProductSkeleton } from "../components/DealProductSkeleton";
import { FilterBottomSheet } from "../components/FilterBottomSheet";
import { FILTERS, GENDER_OPTIONS } from "../lib/dealsConfig";
import { createMoreDealsSectionStyles } from "../style/MoreDealsSection.style";

// ── Icon mapping for categories by keyword ──
// ponytail: linear scan on small fixed-size list — perfectly fine
const CATEGORY_ICON_MAP: { keywords: string[]; icon: any }[] = [
  { keywords: ["shirt", "top", "tee", "t-shirt", "polo"], icon: Shirt01Icon },
  { keywords: ["pant", "trouser", "chino", "jeans", "denim", "short"], icon: ShortsPantsIcon },
  { keywords: ["jacket", "coat", "blazer", "overcoat", "windbreaker", "hoodie", "sweater", "sweat", "pullover"], icon: HoodieIcon },
  { keywords: ["dress", "gown", "maxi", "midi", "skirt"], icon: HangerIcon },
  { keywords: ["kurta", "kurti", "ethnic", "salwar", "lehenga", "saree"], icon: Kurta01Icon },
  { keywords: ["shoe", "boot", "sneaker", "footwear", "sandal", "slipper", "chappal"], icon: SandalsIcon },
  { keywords: ["accessories", "bag", "wallet", "belt", "watch", "glasses"], icon: GlassesIcon },
  { keywords: ["kids", "child", "baby", "infant"], icon: KidIcon },
  { keywords: ["women", "ladies", "girl", "female"], icon: WomanIcon },
  { keywords: ["men", "gents", "male"], icon: ManIcon },
  { keywords: ["shopping", "collection", "general"], icon: ShoppingBag01Icon },
  { keywords: ["sparkle", "special", "ethnic", "traditional"], icon: SparklesIcon },
];

function getIconForCategory(title: string): any {
  const lower = title.toLowerCase();
  for (const { keywords, icon } of CATEGORY_ICON_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return icon;
  }
  return HangerIcon; // generic clothing fallback
}

// ─────────────────────────────────────────────

const getSpeechRecognitionModule = () => {
  if (!(NativeModulesProxy as any)?.ExpoSpeechRecognition) return null;
  try {
    const speech = require("expo-speech-recognition");
    return speech?.ExpoSpeechRecognitionModule ?? null;
  } catch {
    return null;
  }
};

const useDebouncedValue = <T,>(value: T, delay = 500) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// ─────────────────────────────────────────────

export const useMoreDealsLogic = () => {
  const theme = useTheme() as any;
  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => createMoreDealsSectionStyles(theme), [theme]);

  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [activeCampaign, setActiveCampaign] = useState("1");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [activeDropdownType, setActiveDropdownType] = useState<"Gender" | "Categories" | null>(null);
  const [selectedGenderOptions, setSelectedGenderOptions] = useState<string[]>([]);
  const [selectedCategoryOptions, setSelectedCategoryOptions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 500);
  const effectiveSearchQuery = debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : "";

  // 1. Fetch real categories — CLOTHING vertical only
  const { data: rawCategories } = useQuery({
    queryKey: ["categories", "public", "CLOTHING"],
    queryFn: () => getPublicCategoriesRequest({ vertical: "CLOTHING" }),
  });

  // 2. Extract direct clothing subcategories (skip root "Clothing" node)
  const categoryOptions = useMemo(() => {
    if (!rawCategories || rawCategories.length === 0) return [];

    const cleanCats = rawCategories.filter((cat) => {
      if (cat.vertical && cat.vertical !== "CLOTHING") return false;
      const lower = cat.title.toLowerCase();
      return (
        !lower.includes("jewel") &&
        !lower.includes("necklace") &&
        !lower.includes("jhumka") &&
        !lower.includes("bangle") &&
        !lower.includes("earring") &&
        !lower.includes("food") &&
        !lower.includes("grocery")
      );
    });

    // Find root "Clothing" node (no parentId, slug/title = "clothing")
    const rootCat = cleanCats.find((cat) => {
      const hasParent = Boolean(
        typeof cat.parentId === "object" ? (cat.parentId as any)?._id : cat.parentId,
      );
      return (
        !hasParent &&
        (cat.title.toLowerCase() === "clothing" || cat.slug?.toLowerCase() === "clothing")
      );
    });

    let subCats: typeof cleanCats;
    if (rootCat) {
      subCats = cleanCats.filter((cat) => {
        const pId = typeof cat.parentId === "object" ? (cat.parentId as any)?._id : cat.parentId;
        return pId && pId.toString() === rootCat._id.toString();
      });
    } else {
      // Fallback: all categories that have any parentId
      subCats = cleanCats.filter((cat) =>
        Boolean(typeof cat.parentId === "object" ? (cat.parentId as any)?._id : cat.parentId),
      );
    }

    // Last resort: all non-root categories (flat store with no hierarchy)
    const source =
      subCats.length > 0
        ? subCats
        : cleanCats.filter((cat) => cat.title.toLowerCase() !== "clothing");

    return source.map((cat) => ({
      id: cat._id,
      title: cat.title,
      icon: getIconForCategory(cat.title),
    }));
  }, [rawCategories]);

  // 3. Infinite paginated products
  const {
    data: productData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [
      "paginatedProducts",
      activeCampaign,
      selectedCategoryOptions,
      selectedGenderOptions,
      effectiveSearchQuery,
      activeFilter.title,
    ],
    queryFn: ({ pageParam = 1 }) => {
      const params: any = {
        page: pageParam,
        limit: 10,
        gender: selectedGenderOptions.length > 0 ? selectedGenderOptions[0] : undefined,
        search: effectiveSearchQuery || undefined,
      };

      // Subcategory → server subCategory param
      if (selectedCategoryOptions.length > 0) {
        params.subCategory = selectedCategoryOptions[0];
      }

      // Campaign → server params
      if (activeCampaign === "2") { params.isNewArrival = true; params.sortBy = "newest"; }
      else if (activeCampaign === "3") { params.dealOfDay = true; params.sortBy = "discount"; }
      else if (activeCampaign === "4") { params.isExpressAvailable = true; }
      else if (activeCampaign === "5") { params.minRating = 4; params.sortBy = "rating"; }

      // Filter pill → server params
      switch (activeFilter.title) {
        case "Rising Star": params.isTrending = true; break;
        case "New Arrival": params.isNewArrival = true; params.sortBy = "newest"; break;
        case "Top Brand": params.isFeatured = true; break;
        case "Top Rated": params.minRating = 4; params.sortBy = "rating"; break;
        case "₹1000 and above": params.minPrice = 1000; break;
        case "₹500 - ₹999": params.minPrice = 500; params.maxPrice = 999; break;
        case "₹200 - ₹499": params.minPrice = 200; params.maxPrice = 499; break;
        case "Under ₹199": params.maxPrice = 199; break;
      }

      return getPublicProductsRequest(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || typeof lastPage.total === "undefined") return undefined;
      return allPages.length * 10 < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allProducts = useMemo(
    () => productData?.pages.flatMap((page) => page?.data || []) || [],
    [productData],
  );

  const handleApply = (selected: string[]) => {
    if (activeDropdownType === "Gender") setSelectedGenderOptions(selected);
    else if (activeDropdownType === "Categories") setSelectedCategoryOptions(selected);
  };

  const currentOptionsList = activeDropdownType === "Gender" ? GENDER_OPTIONS : categoryOptions;

  // Dynamic pill labels
  const categoryPillLabel = useMemo(() => {
    if (selectedCategoryOptions.length === 0) return "Categories";
    if (selectedCategoryOptions.length === 1) return selectedCategoryOptions[0];
    return `Categories (${selectedCategoryOptions.length})`;
  }, [selectedCategoryOptions]);

  const genderPillLabel = useMemo(() => {
    if (selectedGenderOptions.length === 0) return "Gender";
    if (selectedGenderOptions.length === 1) return selectedGenderOptions[0];
    return `Gender (${selectedGenderOptions.length})`;
  }, [selectedGenderOptions]);

  const cardWidth = (width - spacing.md * 2 - spacing.sm) / 2;

  return {
    theme,
    width,
    styles,
    activeCampaign,
    setActiveCampaign,
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
    categoryPillLabel,
    genderPillLabel,
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

// ─────────────────────────────────────────────

export const MoreDealsFilters = ({
  theme,
  styles,
  activeFilter,
  setActiveFilter,
  setActiveDropdownType,
  setDropdownVisible,
  searchQuery,
  setSearchQuery,
  selectedCategoryOptions,
  selectedGenderOptions,
  categoryPillLabel,
  genderPillLabel,
}: any) => {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speechModule = useMemo(() => getSpeechRecognitionModule(), []);
  const isSpeechModuleAvailable = !!speechModule;

  useEffect(() => {
    if (!speechModule?.addListener) return;

    const startSub = speechModule.addListener("start", () => { setIsListening(true); setSpeechError(null); });
    const endSub = speechModule.addListener("end", () => setIsListening(false));
    const resultSub = speechModule.addListener("result", (event: any) => {
      const transcript = event?.results?.[0]?.transcript?.trim();
      if (transcript) setSearchQuery(transcript);
    });
    const errorSub = speechModule.addListener("error", (event: any) => {
      setIsListening(false);
      setSpeechError(event?.message || "Voice search is unavailable right now.");
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
    if (!speechModule || !speechModule.isRecognitionAvailable?.()) return;
    if (isListening) { speechModule.stop?.(); return; }
    try {
      const permission = await speechModule.requestPermissionsAsync?.();
      if (!permission.granted) { setSpeechError("Microphone permission is required for voice search."); return; }
      speechModule.start?.({ lang: "en-IN", interimResults: true, continuous: false, maxAlternatives: 1, iosTaskHint: "search" });
    } catch {
      setSpeechError("Could not start voice search.");
    }
  }, [isListening, speechModule]);

  // Dynamic filter pills with resolved display labels
  const dynamicFilters = useMemo(
    () =>
      FILTERS.map((f) => {
        if (f.title === "Categories") {
          return { ...f, displayTitle: categoryPillLabel, hasSelection: selectedCategoryOptions.length > 0 };
        }
        if (f.title === "Gender") {
          return { ...f, displayTitle: genderPillLabel, hasSelection: selectedGenderOptions.length > 0 };
        }
        return { ...f, displayTitle: f.title, hasSelection: false };
      }),
    [categoryPillLabel, genderPillLabel, selectedCategoryOptions, selectedGenderOptions],
  );

  return (
    <View style={[styles.filterWrapper, { backgroundColor: theme.background, paddingBottom: 12, zIndex: 10 }]}>
      {/* Search bar */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: 18, marginTop: 14 }}>
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
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.tertiaryBackground, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
            <Ionicons name="search" size={17} color={searchQuery ? theme.primary : theme.secondaryText} />
          </View>
          <TextInput
            placeholder="Search products, brands..."
            placeholderTextColor={theme.tertiaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
            style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "500", letterSpacing: -0.2 }}
            selectionColor={theme.primary}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== "ios" ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4, marginRight: 4 }}>
              <Ionicons name="close-circle" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={handleMicPress}
            activeOpacity={0.8}
            disabled={!isSpeechModuleAvailable}
            style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: isListening ? theme.primary : "transparent", opacity: isSpeechModuleAvailable ? 1 : 0.5 }}
          >
            <Ionicons name={isListening ? "mic" : "mic-outline"} size={18} color={isListening ? "#fff" : theme.tertiaryText} />
          </TouchableOpacity>
        </View>

        {searchQuery.length > 0 && (
          <View style={{ marginTop: 10, paddingHorizontal: 6, flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="flash-outline" size={13} color={theme.primary} />
            <Text style={{ marginLeft: 6, fontSize: 12, color: theme.secondaryText, fontWeight: "500" }}>
              Showing results for{" "}
              <Text style={{ color: theme.primary, fontWeight: "700" }}>"{searchQuery}"</Text>
            </Text>
          </View>
        )}
        {speechError ? (
          <Text style={{ marginTop: 8, marginLeft: 6, color: theme.error, fontSize: 12, fontWeight: "500" }}>
            {speechError}
          </Text>
        ) : null}
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
        {dynamicFilters.map((filter) => {
          const isActive = activeFilter.title === filter.title || filter.hasSelection;
          const isDropdown = filter.title === "Gender" || filter.title === "Categories";

          return (
            <TouchableOpacity
              key={filter.title}
              onPress={() => {
                setActiveFilter({ title: filter.title, icon: filter.icon });
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
                <HugeiconsIcon {...({ icon: filter.icon as any, size: 14, color: isActive ? "#fff" : theme.iconColor } as any)} />
              )}
              <Text style={[styles.filterText, { color: isActive ? "#fff" : theme.text }]}>
                {filter.displayTitle}
              </Text>
              {isDropdown && (
                <Ionicons name="chevron-down" size={14} color={isActive ? "#fff" : theme.iconColor} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────

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
      [1, 2, 3, 4, 5, 6].map((key) => <DealProductSkeleton key={key} width={cardWidth} />)
    ) : allProducts.length > 0 ? (
      allProducts.map((product: any) => (
        <DealProductCard key={product._id} product={product} width={cardWidth} />
      ))
    ) : (
      <View style={{ width: "100%", paddingVertical: 60, alignItems: "center" }}>
        <Ionicons name="search-outline" size={48} color={theme.tertiaryText} />
        <Text style={{ marginTop: 16, fontSize: 16, color: theme.secondaryText, fontWeight: "600" }}>
          No products found
        </Text>
        <Text style={{ marginTop: 8, fontSize: 14, color: theme.tertiaryText, textAlign: "center", paddingHorizontal: 40 }}>
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
          <Text style={{ color: theme.primary, fontWeight: "600" }}>Load More</Text>
        )}
      </TouchableOpacity>
    )}

    {activeDropdownType && (
      <FilterBottomSheet
        visible={dropdownVisible}
        onClose={() => setDropdownVisible(false)}
        title={activeDropdownType}
        options={currentOptionsList}
        initialSelected={activeDropdownType === "Gender" ? selectedGenderOptions : selectedCategoryOptions}
        onApply={handleApply}
      />
    )}
  </View>
);

// Fallback for legacy imports
const MoreDealsSection = () => (
  <Text>Please use the destructured components for MoreDealsSection directly</Text>
);

export default MoreDealsSection;
