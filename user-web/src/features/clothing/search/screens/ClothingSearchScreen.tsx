import React, { useState, useCallback, useEffect } from "react";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
import { useNavigate } from "react-router-dom";
import { goTo, useRouteParams } from "@/src/utils/navigation";
import * as Haptics from "@/lib/haptics";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import FilterBar, {
  SortOption,
} from "@/src/features/clothing/search/components/FilterBar";
import {
  SearchFilters,
  useSearchProducts,
} from "@/src/features/clothing/search/hooks/useSearchProducts";
import { categoriesData } from "@/src/features/clothing/home/lib/data";
import SearchHeader from "@/src/features/clothing/search/components/SearchHeader";
import RecentSearches from "@/src/features/clothing/search/components/RecentSearches";
import TrendingSection from "@/src/features/clothing/search/components/TrendingSection";
import SearchResults from "@/src/features/clothing/search/components/SearchResults";
import { cn } from "@/src/lib/utils";

const TRENDING_ITEMS = categoriesData.map((c) => c.title);

const ClothingSearchScreen = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    query: initialQuery,
    categoryId,
    categoryName,
    subCategory,
  } = useRouteParams<{
    query?: string;
    categoryId?: string;
    categoryName?: string;
    subCategory?: string;
  }>();

  const activeInitial = categoryName || subCategory || initialQuery || "";
  const [query, setQuery] = useState(activeInitial);
  const [debouncedQuery, setDebouncedQuery] = useState(activeInitial);
  const [history, setHistory] = useState(["Summer Dress", "Jeans", "Sarees"]);
  const [selectedSort, setSelectedSort] = useState<SortOption>("relevance");
  const [filters, setFilters] = useState<SearchFilters>(
    categoryName || subCategory || categoryId
      ? {
          category: categoryName || undefined,
          subCategory: subCategory || undefined,
          categoryId: categoryId || undefined,
          categoryName: categoryName || undefined,
        }
      : {},
  );

  // Debounce query to optimize API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(handler);
  }, [query]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useSearchProducts(debouncedQuery, { ...filters, sortBy: selectedSort });

  // Flatten pages for SearchResults
  const flatResults = data?.pages.flatMap((page) => page.data) || [];

  const onSearchTrigger = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) return;

      if (!history.includes(searchTerm)) {
        setHistory((prev) => [searchTerm, ...prev.slice(0, 4)]);
      }
    },
    [history],
  );

  useEffect(() => {
    if (initialQuery || categoryId || categoryName || subCategory) {
      const active = categoryName || subCategory || initialQuery || "";
      // Intentional URL-param → state sync when navigating from categories.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(active);
      setDebouncedQuery(active);
      setFilters((prev) => ({
        ...prev,
        category: categoryName || undefined,
        subCategory: subCategory || undefined,
        categoryId: categoryId || undefined,
        categoryName: categoryName || undefined,
      }));
      onSearchTrigger(active);
    }
  }, [initialQuery, categoryId, categoryName, subCategory, onSearchTrigger]);

  const handleSortChange = (sort: SortOption) => {
    setSelectedSort(sort);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const winW = useWindowWidth();
  const isDesktop = winW >= BREAKPOINTS.desktopMin;

  const onClearHistory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setHistory([]);
  };

  const onRemoveItem = (itemToRemove: string) => {
    setHistory((prev) => prev.filter((item) => item !== itemToRemove));
  };

  const onSelectItem = (item: string) => {
    setQuery(item);
    setDebouncedQuery(item); // Immediate update for explicit selections
    onSearchTrigger(item);
  };

  const handleItemPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goTo(navigate, { pathname: "/product/[id]", params: { id } } as any);
  };

  return (
    <div className="flex-1" style={{ backgroundColor: theme.background }}>
        {/* Desktop: centered 1280px column; mobile renders edge-to-edge. */}
        <div className={cn("flex-1", isDesktop && "mx-auto w-full max-w-[1280px] px-6")}>
          <SearchHeader
            query={query}
            setQuery={setQuery}
            onClear={() => {
              setQuery("");
            }}
            onSubmit={() => {
              setDebouncedQuery(query);
              onSearchTrigger(query);
            }}
          />

          {query.length > 0 && (
            <FilterBar
              selectedSort={selectedSort}
              onSortChange={handleSortChange}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}

          <div className="flex-1">
            {query.length === 0 ? (
              <div className="pb-5">
                <RecentSearches
                  history={history}
                  onSelect={onSelectItem}
                  onRemove={onRemoveItem}
                  onClearAll={onClearHistory}
                />
                <TrendingSection
                  trendingItems={TRENDING_ITEMS}
                  onSelect={onSelectItem}
                />
              </div>
            ) : (
              <SearchResults
                results={flatResults}
                loading={isLoading}
                onItemPress={handleItemPress}
                onEndReached={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                isFetchingNextPage={isFetchingNextPage}
              />
            )}
          </div>
        </div>
      </div>
  );
};

export default ClothingSearchScreen;
