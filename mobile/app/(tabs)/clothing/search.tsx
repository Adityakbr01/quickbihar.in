import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, ScrollView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import FilterBar, {
  SortOption,
} from "@/src/features/Clothings/search/components/FilterBar";
import {
  SearchFilters,
  useSearchProducts,
} from "@/src/features/Clothings/search/hooks/useSearchProducts";
import { categoriesData } from "@/src/features/Clothings/home/lib/data";
import SearchHeader from "@/src/features/Clothings/search/components/SearchHeader";
import RecentSearches from "@/src/features/Clothings/search/components/RecentSearches";
import TrendingSection from "@/src/features/Clothings/search/components/TrendingSection";
import SearchResults from "@/src/features/Clothings/search/components/SearchResults";

const TRENDING_ITEMS = categoriesData.map((c) => c.title);

const SearchScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const {
    query: initialQuery,
    categoryId,
    categoryName,
  } = useLocalSearchParams<{
    query: string;
    categoryId: string;
    categoryName: string;
  }>();

  const [query, setQuery] = useState(categoryName || initialQuery || "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [history, setHistory] = useState(["Summer Dress", "Jeans", "Sarees"]);
  const [selectedSort, setSelectedSort] = useState<SortOption>("relevance");
  const [filters, setFilters] = useState<SearchFilters>(
    categoryId ? { category: categoryId } : {},
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
    if (initialQuery || categoryId) {
      setQuery(categoryName || initialQuery || "");
      onSearchTrigger(categoryName || initialQuery || "");
    }
  }, [initialQuery, categoryId, categoryName, onSearchTrigger]);

  const handleSortChange = (sort: SortOption) => {
    setSelectedSort(sort);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
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
});
