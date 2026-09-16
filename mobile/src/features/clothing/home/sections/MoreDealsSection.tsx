import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { spacing } from "@/src/theme/spacing";
import { BREAKPOINTS, getGridCardWidth, useProductColumns } from "@/src/utils/responsive";
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
    // Dynamic import keeps the native module optional (Expo Go safe).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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

  // 2. Structured Category & Subcategory Groups (Clothing vertical)
  const categoryGroups = useMemo(() => {
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
        !lower.includes("grocery") &&
        !lower.includes("accessori")
      );
    });

    // Root categories: those without a parentId, excluding a generic "Clothing" node if any
    const roots = cleanCats.filter((cat) => {
      const hasParent = Boolean(
        typeof cat.parentId === "object" ? (cat.parentId as any)?._id : cat.parentId,
      );
      return (
        !hasParent &&
        cat.title.toLowerCase() !== "clothing" &&
        cat.slug?.toLowerCase() !== "clothing"
      );
    });

    // Sort roots by homePosition (1, 2, 3...) then priority (descending)
    roots.sort((a, b) => {
      const posA = a.homePosition && a.homePosition > 0 ? a.homePosition : 999;
      const posB = b.homePosition && b.homePosition > 0 ? b.homePosition : 999;
      if (posA !== posB) return posA - posB;
      return (b.priority || 0) - (a.priority || 0);
    });

    return roots.map((parent) => {
      const pIdStr = parent._id.toString();
      const subCats = cleanCats.filter((cat) => {
        const pId = typeof cat.parentId === "object" ? (cat.parentId as any)?._id : cat.parentId;
        return pId && pId.toString() === pIdStr;
      });

      subCats.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      return {
        id: parent._id,
        title: parent.title,
        slug: parent.slug,
        icon: getIconForCategory(parent.title),
        subCategories: subCats.map((sub) => ({
          id: sub._id,
          title: sub.title,
          slug: sub.slug,
          parentId: parent._id,
          parentTitle: parent.title,
          icon: getIconForCategory(sub.title),
        })),
      };
    });
  }, [rawCategories]);

  // Flat category options for search / legacy fallback
  const categoryOptions = useMemo(() => {
    return categoryGroups.flatMap((group) => [
      { id: group.id, title: group.title, icon: group.icon, isParent: true },
      ...group.subCategories.map((sub) => ({
        id: sub.id,
        title: sub.title,
        icon: sub.icon,
        parentId: group.id,
        parentTitle: group.title,
        isParent: false,
      })),
    ]);
  }, [categoryGroups]);

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
        // Send EVERY selected gender (backend $in-matches + always includes
        // Unisex). Previously only [0] was sent, so multi-select showed just
        // the first gender's products.
        gender: selectedGenderOptions.length > 0 ? [...selectedGenderOptions] : undefined,
        search: effectiveSearchQuery || undefined,
      };

      // Smart category & subcategory query handling
      if (selectedCategoryOptions.length > 0) {
        const selectedTitles = selectedCategoryOptions;
        const matchingRoot = categoryGroups.find((g) => selectedTitles.includes(g.title));

        if (matchingRoot && selectedTitles.length === 1) {
          // Entire parent category selected (e.g. "Men's Wear")
          params.category = matchingRoot.title;
        } else {
          // Specific subcategories selected (e.g. "Men's Shirts" or "Men's Shirts|Men's T-Shirts")
          params.subCategory = selectedTitles.join("|");
        }
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

  // One-tap reset for the pills row — clears gender + category selections.
  const clearFilterSelections = useCallback(() => {
    setSelectedGenderOptions([]);
    setSelectedCategoryOptions([]);
  }, []);

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

  const columns = useProductColumns();
  const isDesktop = Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;
  const isWide = Platform.OS === "web" && width >= BREAKPOINTS.tabletMin;
  // Mobile formula is byte-identical to before; desktop/tablet use the
  // centered-column grid math so cards fill 3/4/5 columns.
  const cardWidth = isWide
    ? getGridCardWidth(width, columns, { gap: isDesktop ? 20 : 16 })
    : (width - spacing.md * 2 - spacing.sm) / 2;

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
    clearFilterSelections,
    currentOptionsList,
    categoryGroups,
    categoryPillLabel,
    genderPillLabel,
    cardWidth,
    columns,
    isDesktop,
    isWide,
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
  theme: propTheme,
  styles: propStyles,
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
  clearFilterSelections,
  isDesktop: propIsDesktop,
}: any) => {
  const hookTheme = useTheme();
  const theme = propTheme || hookTheme;
  const styles = React.useMemo(
    () => propStyles || createMoreDealsSectionStyles(theme),
    [propStyles, theme],
  );
  const { width: winW } = useWindowDimensions();
  const isDesktop = propIsDesktop ?? (Platform.OS === "web" && winW >= BREAKPOINTS.desktopMin);
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
    <View
      style={[
        styles.filterWrapper,
        {
          backgroundColor: theme.background,
          paddingBottom: 12,
          zIndex: 10,
          // Desktop: floating filter card inside the centered column.
          ...(isDesktop
            ? {
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 20,
                marginTop: 8,
                paddingBottom: 16,
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 18,
                elevation: 3,
              }
            : null),
        },
      ]}
    >
      {/* Search bar */}
      <View
        style={
          isDesktop
            ? {
                paddingHorizontal: 20,
                marginBottom: 16,
                marginTop: 18,
                width: "100%",
                maxWidth: 680,
                alignSelf: "center",
              }
            : { paddingHorizontal: spacing.lg, marginBottom: 18, marginTop: 14 }
        }
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
              <Text style={{ color: theme.primary, fontWeight: "700" }}>{'"'}{searchQuery}{'"'}</Text>
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          isDesktop
            ? [styles.filterList, { paddingHorizontal: 20, gap: 12 }]
            : styles.filterList
        }
      >
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

        {/* One-tap reset — only when gender/category selections are active */}
        {(selectedGenderOptions.length > 0 || selectedCategoryOptions.length > 0) && (
          <TouchableOpacity
            onPress={() => clearFilterSelections?.()}
            style={[
              styles.filterPill,
              {
                borderColor: theme.border,
                backgroundColor: theme.secondaryBackground,
              },
            ]}
          >
            <Ionicons name="close-circle-outline" size={14} color={theme.secondaryText} />
            <Text style={[styles.filterText, { color: theme.secondaryText }]}>
              Reset
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────

export const MoreDealsGrid = ({
  styles: propStyles,
  cardWidth,
  activeDropdownType,
  dropdownVisible,
  setDropdownVisible,
  currentOptionsList,
  categoryGroups,
  selectedGenderOptions,
  selectedCategoryOptions,
  handleApply,
  allProducts,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  theme: propTheme,
  isDesktop: propIsDesktop,
}: any) => {
  const hookTheme = useTheme();
  const theme = propTheme || hookTheme;
  const styles = propStyles || createMoreDealsSectionStyles(theme);
  const { width: winW } = useWindowDimensions();
  const isDesktop = propIsDesktop ?? (Platform.OS === "web" && winW >= BREAKPOINTS.desktopMin);

  return (
    <View
      style={[
        styles.productGrid,
        // Desktop: airy 4–5 col grid; mobile keeps space-between 2-col.
        isDesktop
          ? {
              paddingHorizontal: 0,
              justifyContent: "flex-start",
              gap: 20,
              rowGap: 28,
            }
          : null,
      ]}
    >
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
          {"Try adjusting your search or filters to find what you're looking for."}
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
        categoryGroups={activeDropdownType === "Categories" ? categoryGroups : undefined}
        initialSelected={activeDropdownType === "Gender" ? selectedGenderOptions : selectedCategoryOptions}
        onApply={handleApply}
      />
    )}
  </View>
  );
};

// Fallback for legacy imports
const MoreDealsSection = () => (
  <Text>Please use the destructured components for MoreDealsSection directly</Text>
);

export default MoreDealsSection;
