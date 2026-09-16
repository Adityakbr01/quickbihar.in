import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, ScrollView, Platform, useWindowDimensions } from "react-native";
import { BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
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
import { SeoHead } from "@/src/components/seo/SeoHead";
import { staticPageMeta } from "@/src/lib/seo";

const TRENDING_ITEMS = categoriesData.map((c) => c.title);

const SearchScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const {
    query: initialQuery,
    categoryId,
    categoryName,
    subCategory,
  } = useLocalSearchParams<{
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
    refetch,
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

  const { width: winW } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && winW >= BREAKPOINTS.desktopMin;

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
    router.push({ pathname: "/product/[id]", params: { id } });
  };

  return (
    <SafeViewWrapper>
      <SeoHead
        meta={(() => {
          // Query-param variants (?q, ?categoryId, …) create infinite thin/duplicate
          // URLs — keep them crawlable for users but out of the index, canonicalized
          // to the clean hub. Only the clean hub shell is indexable.
          const hasQueryParams = Boolean(initialQuery || categoryId || categoryName || subCategory);
          const base = staticPageMeta({
            title: "Search Fashion Online in Bihar | QuickBihar",
            description:
              "Search clothes, ethnic wear and accessories from local Bihar stores on QuickBihar.",
            path: "/clothing/search",
            keywords:
              "search clothing Bihar, search products QuickBihar, buy online Patna, buy online Buxar, ethnic wear Bihar, clothes shopping app, local stores delivery",
          });
          if (hasQueryParams) base.robots = "noindex, nofollow";
          return base;
        })()}
      />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Desktop: centered 1280px column; mobile renders edge-to-edge. */}
        <View style={isDesktop ? styles.desktopColumn : styles.mobileFill}>
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

        <View style={styles.content}>
          {query.length === 0 ? (
            <ScrollView
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
            >
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
            </ScrollView>
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
        </View>
        </View>
      </View>
    </SafeViewWrapper>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  // Mobile passthrough keeps legacy layout identical.
  mobileFill: {
    flex: 1,
  },
  // Desktop-only: centered 1280px column. Never applied on mobile.
  desktopColumn: {
    width: "100%",
    maxWidth: DESKTOP.maxWidth,
    alignSelf: "center",
    marginHorizontal: "auto" as any,
    paddingHorizontal: DESKTOP.gutter,
    flex: 1,
  },
});
