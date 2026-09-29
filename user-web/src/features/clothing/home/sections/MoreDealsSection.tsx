import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  BREAKPOINTS,
  getGridCardWidth,
  useProductColumns,
  useWindowWidth,
} from "@/src/utils/responsive";
import { ChevronDown, CircleX, Search, Zap } from "lucide-react";
import { AppIcon } from "@/src/components/common/AppIcon";
import type { LucideIcon } from "lucide-react";
import {
  Shirt,
  Scissors,
  Snowflake,
  Flower2,
  Layers,
  Footprints,
  Glasses,
  Smile,
  User,
  Mic,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getPublicCategoriesRequest } from "@/src/features/common/category/api/category.api";
import { getPublicProductsRequest } from "../../product/api/product.api";
import { DealProductCard } from "../components/DealProductCard";
import { DealProductSkeleton } from "../components/DealProductSkeleton";
import { FilterBottomSheet } from "../components/FilterBottomSheet";
import { FILTERS, GENDER_OPTIONS } from "../lib/dealsConfig";
import { TextInput } from "@/src/theme/components/TextInput";
import { cn } from "@/src/lib/utils";

// ── Icon mapping for categories by keyword ──
// ponytail: linear scan on small fixed-size list — perfectly fine
const CATEGORY_ICON_MAP: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ["shirt", "top", "tee", "t-shirt", "polo"], icon: Shirt },
  {
    keywords: ["pant", "trouser", "chino", "jeans", "denim", "short"],
    icon: Scissors,
  },
  {
    keywords: [
      "jacket",
      "coat",
      "blazer",
      "overcoat",
      "windbreaker",
      "hoodie",
      "sweater",
      "sweat",
      "pullover",
    ],
    icon: Snowflake,
  },
  { keywords: ["dress", "gown", "maxi", "midi", "skirt"], icon: Flower2 },
  {
    keywords: ["kurta", "kurti", "ethnic", "salwar", "lehenga", "saree"],
    icon: Layers,
  },
  {
    keywords: [
      "shoe",
      "boot",
      "sneaker",
      "footwear",
      "sandal",
      "slipper",
      "chappal",
    ],
    icon: Footprints,
  },
  {
    keywords: ["accessories", "bag", "wallet", "belt", "watch", "glasses"],
    icon: Glasses,
  },
  { keywords: ["kids", "child", "baby", "infant"], icon: Smile },
  { keywords: ["women", "ladies", "girl", "female"], icon: User },
  { keywords: ["men", "gents", "male"], icon: User },
  { keywords: ["shopping", "collection", "general"], icon: ShoppingBag },
  { keywords: ["sparkle", "special", "ethnic", "traditional"], icon: Sparkles },
];

function getIconForCategory(title: string): LucideIcon {
  const lower = title.toLowerCase();
  for (const { keywords, icon } of CATEGORY_ICON_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return icon;
  }
  return Flower2; // generic clothing fallback
}

// ─────────────────────────────────────────────

const getSpeechRecognitionModule = () => {
  return null;
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
  const width = useWindowWidth();

  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [activeCampaign, setActiveCampaign] = useState("1");
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

  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 500);
  const effectiveSearchQuery =
    debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : "";

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
        typeof cat.parentId === "object"
          ? (cat.parentId as any)?._id
          : cat.parentId,
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
        const pId =
          typeof cat.parentId === "object"
            ? (cat.parentId as any)?._id
            : cat.parentId;
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
        gender:
          selectedGenderOptions.length > 0
            ? [...selectedGenderOptions]
            : undefined,
        search: effectiveSearchQuery || undefined,
      };

      // Smart category & subcategory query handling
      if (selectedCategoryOptions.length > 0) {
        const selectedTitles = selectedCategoryOptions;
        const matchingRoot = categoryGroups.find((g) =>
          selectedTitles.includes(g.title),
        );

        if (matchingRoot && selectedTitles.length === 1) {
          // Entire parent category selected (e.g. "Men's Wear")
          params.category = matchingRoot.title;
        } else {
          // Specific subcategories selected (e.g. "Men's Shirts" or "Men's Shirts|Men's T-Shirts")
          params.subCategory = selectedTitles.join("|");
        }
      }

      // Campaign → server params
      if (activeCampaign === "2") {
        params.isNewArrival = true;
        params.sortBy = "newest";
      } else if (activeCampaign === "3") {
        params.dealOfDay = true;
        params.sortBy = "discount";
      } else if (activeCampaign === "4") {
        params.isExpressAvailable = true;
      } else if (activeCampaign === "5") {
        params.minRating = 4;
        params.sortBy = "rating";
      }

      // Filter pill → server params
      switch (activeFilter.title) {
        case "Rising Star":
          params.isTrending = true;
          break;
        case "New Arrival":
          params.isNewArrival = true;
          params.sortBy = "newest";
          break;
        case "Top Brand":
          params.isFeatured = true;
          break;
        case "Top Rated":
          params.minRating = 4;
          params.sortBy = "rating";
          break;
        case "₹1000 and above":
          params.minPrice = 1000;
          break;
        case "₹500 - ₹999":
          params.minPrice = 500;
          params.maxPrice = 999;
          break;
        case "₹200 - ₹499":
          params.minPrice = 200;
          params.maxPrice = 499;
          break;
        case "Under ₹199":
          params.maxPrice = 199;
          break;
      }

      return getPublicProductsRequest(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || typeof lastPage.total === "undefined") return undefined;
      return allPages.length * 10 < lastPage.total
        ? allPages.length + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const allProducts = useMemo(
    () => productData?.pages.flatMap((page) => page?.data || []) || [],
    [productData],
  );

  const handleApply = (selected: string[]) => {
    if (activeDropdownType === "Gender") setSelectedGenderOptions(selected);
    else if (activeDropdownType === "Categories")
      setSelectedCategoryOptions(selected);
  };

  // One-tap reset for the pills row — clears gender + category selections.
  const clearFilterSelections = useCallback(() => {
    setSelectedGenderOptions([]);
    setSelectedCategoryOptions([]);
  }, []);

  const currentOptionsList =
    activeDropdownType === "Gender" ? GENDER_OPTIONS : categoryOptions;

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
  const isDesktop = width >= BREAKPOINTS.desktopMin;
  const isWide = width >= BREAKPOINTS.tabletMin;
  // Mobile formula is byte-identical to before; desktop/tablet use the
  // centered-column grid math so cards fill 3/4/5 columns.
  const cardWidth = isWide
    ? getGridCardWidth(width, columns, { gap: isDesktop ? 20 : 16 })
    : (width - 16 * 2 - 12) / 2;

  return {
    theme,
    width,
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
  const winW = useWindowWidth();
  const isDesktop = propIsDesktop ?? winW >= BREAKPOINTS.desktopMin;

  // Dynamic filter pills with resolved display labels
  const dynamicFilters = useMemo(
    () =>
      FILTERS.map((f) => {
        if (f.title === "Categories") {
          return {
            ...f,
            displayTitle: categoryPillLabel,
            hasSelection: selectedCategoryOptions.length > 0,
          };
        }
        if (f.title === "Gender") {
          return {
            ...f,
            displayTitle: genderPillLabel,
            hasSelection: selectedGenderOptions.length > 0,
          };
        }
        return { ...f, displayTitle: f.title, hasSelection: false };
      }),
    [
      categoryPillLabel,
      genderPillLabel,
      selectedCategoryOptions,
      selectedGenderOptions,
    ],
  );

  return (
    <div
      className={cn(
        "z-10 mb-6 pb-3",
        isDesktop && "mt-2 rounded-[20px] border px-0 pt-4 pb-4 shadow-xl",
      )}
      style={{
        backgroundColor: theme.background,
        ...(isDesktop ? { borderColor: theme.border } : null),
      }}
    >
      {/* Search bar — mobile only. Desktop uses the navbar search;
          the deals card keeps filters alone. */}
      {!isDesktop && (
        <div className="pt-3.5 mb-4.5 px-6">
          <TextInput
            placeholder="Search products, brands..."
            placeholderTextColor={theme.tertiaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
            selectionColor={theme.primary}
            icon={
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full"
                style={{ backgroundColor: theme.tertiaryBackground }}
              >
                <Search
                  size={17}
                  color={searchQuery ? theme.primary : theme.secondaryText}
                />
              </span>
            }
            rightIcon={
              <>
                {searchQuery.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mr-1 cursor-pointer p-1"
                    aria-label="Clear search"
                  >
                    <CircleX size={20} color={theme.secondaryText} />
                  </button>
                ) : null}
              </>
            }
            containerStyle={{ marginBottom: 0 }}
            inputContainerStyle={{
              backgroundColor: theme.secondaryBackground,
              borderRadius: 50,
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderWidth: 1,
            }}
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: "500",
              letterSpacing: -0.2,
            }}
          />

          {searchQuery.length > 0 && (
            <div className="mt-2.5 flex flex-row items-center px-1.5">
              <Zap size={13} color={theme.primary} />
              <p
                className="ml-1.5 text-xs font-medium"
                style={{ color: theme.secondaryText }}
              >
                Showing results for{" "}
                <span className="font-bold" style={{ color: theme.primary }}>
                  "{searchQuery}"
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter pills */}
      <div
        className={cn(
          "flex flex-row gap-2.5 overflow-x-auto px-6",
          isDesktop && "gap-3 px-5",
        )}
        style={{ scrollbarWidth: "none" }}
      >
        {dynamicFilters.map((filter) => {
          const isActive =
            activeFilter.title === filter.title || filter.hasSelection;
          const isDropdown =
            filter.title === "Gender" || filter.title === "Categories";

          return (
            <button
              key={filter.title}
              type="button"
              onClick={() => {
                setActiveFilter({ title: filter.title, icon: filter.icon });
                if (isDropdown) {
                  setActiveDropdownType(
                    filter.title as "Gender" | "Categories",
                  );
                  setDropdownVisible(true);
                }
              }}
              className="flex shrink-0 cursor-pointer flex-row items-center gap-1.5 rounded-full border px-4 py-2"
              style={{
                borderColor: isActive ? theme.primary : theme.border,
                backgroundColor: isActive ? theme.primary : theme.background,
              }}
            >
              {filter.icon && (
                <AppIcon
                  icon={filter.icon}
                  size={14}
                  color={isActive ? "#fff" : theme.iconColor}
                />
              )}
              <span
                className="text-[13px] font-semibold"
                style={{ color: isActive ? "#fff" : theme.text }}
              >
                {filter.displayTitle}
              </span>
              {isDropdown && (
                <ChevronDown
                  size={14}
                  color={isActive ? "#fff" : theme.iconColor}
                />
              )}
            </button>
          );
        })}

        {/* One-tap reset — only when gender/category selections are active */}
        {(selectedGenderOptions.length > 0 ||
          selectedCategoryOptions.length > 0) && (
          <button
            type="button"
            onClick={() => clearFilterSelections?.()}
            className="flex shrink-0 cursor-pointer flex-row items-center gap-1.5 rounded-full border px-4 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.secondaryBackground,
            }}
          >
            <CircleX size={14} color={theme.secondaryText} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: theme.secondaryText }}
            >
              Reset
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────

export const MoreDealsGrid = ({
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
  const winW = useWindowWidth();
  const isDesktop = propIsDesktop ?? winW >= BREAKPOINTS.desktopMin;

  return (
    <div
      className={cn(
        "flex flex-row flex-wrap justify-start gap-3 px-4",
        isDesktop && "gap-5 px-0",
      )}
      style={isDesktop ? { rowGap: 28 } : { rowGap: 24 }}
    >
      {isLoading && !allProducts.length ? (
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
        <div className="flex w-full flex-col items-center py-15">
          <Search size={48} color={theme.tertiaryText} />
          <p
            className="mt-4 text-base font-semibold"
            style={{ color: theme.secondaryText }}
          >
            No products found
          </p>
          <p
            className="mt-2 px-10 text-center text-sm"
            style={{ color: theme.tertiaryText }}
          >
            {
              "Try adjusting your search or filters to find what you're looking for."
            }
          </p>
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full cursor-pointer p-5 text-center"
        >
          {isFetchingNextPage ? (
            <span
              className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{
                borderColor: `${theme.primary}40`,
                borderTopColor: theme.primary,
              }}
            />
          ) : (
            <span className="font-semibold" style={{ color: theme.primary }}>
              Load More
            </span>
          )}
        </button>
      )}

      {activeDropdownType && (
        <FilterBottomSheet
          visible={dropdownVisible}
          onClose={() => setDropdownVisible(false)}
          title={activeDropdownType}
          options={currentOptionsList}
          categoryGroups={
            activeDropdownType === "Categories" ? categoryGroups : undefined
          }
          initialSelected={
            activeDropdownType === "Gender"
              ? selectedGenderOptions
              : selectedCategoryOptions
          }
          onApply={handleApply}
        />
      )}
    </div>
  );
};

// Fallback for legacy imports
const MoreDealsSection = () => (
  <p>Please use the destructured components for MoreDealsSection directly</p>
);

export default MoreDealsSection;
