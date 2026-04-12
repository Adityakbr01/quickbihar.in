import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, ScrollView, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

import SearchHeader from "@/src/features/search/components/SearchHeader";
import RecentSearches from "@/src/features/search/components/RecentSearches";
import TrendingSection from "@/src/features/search/components/TrendingSection";
import SearchResults from "@/src/features/search/components/SearchResults";
import FilterBar, { SortOption } from "@/src/features/search/components/FilterBar";

// Import real mock data
import { MOCK_PRODUCTS, Product } from "@/src/features/home/lib/mockData";
import { categoriesData } from "@/src/features/home/lib/data";

const TRENDING_ITEMS = categoriesData.map(c => c.title);

const SearchScreen = () => {
    const theme = useTheme();
    const { query: initialQuery } = useLocalSearchParams<{ query: string }>();

    const [query, setQuery] = useState(initialQuery || "");
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState(["Summer Dress", "Jeans", "Sarees"]);
    const [selectedSort, setSelectedSort] = useState<SortOption>("relevance");

    const parsePrice = (priceStr: string) => {
        return parseInt(priceStr.replace(/[^0-9]/g, ""));
    };

    const handleSearch = useCallback((searchTerm: string, sort?: SortOption) => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        const currentSort = sort || selectedSort;

        // Simulate API delay
        setTimeout(() => {
            const words = searchTerm.split(/\s+/).filter(Boolean);
            const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
            const regex = new RegExp(escapedWords.join("|"), "i");

            let filtered = MOCK_PRODUCTS.filter(item =>
                regex.test(item.name) ||
                (item as any).category && regex.test((item as any).category) ||
                (item as any).tags && (item as any).tags.some((tag: string) => regex.test(tag))
            );

            // Sorting logic
            if (currentSort === "price_low") {
                filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
            } else if (currentSort === "price_high") {
                filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
            } else if (currentSort === "rating") {
                filtered.sort((a, b) => b.rating - a.rating);
            }

            setResults(filtered);
            setLoading(false);

            if (!history.includes(searchTerm)) {
                setHistory(prev => [searchTerm, ...prev.slice(0, 4)]);
            }
        }, 600);
    }, [history, selectedSort]);

    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            handleSearch(initialQuery);
        }
    }, [initialQuery, handleSearch]);

    const handleSortChange = (sort: SortOption) => {
        setSelectedSort(sort);
        if (query.trim()) {
            handleSearch(query, sort);
        }
    };

    const onClearHistory = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setHistory([]);
    };

    const onRemoveItem = (itemToRemove: string) => {
        setHistory(prev => prev.filter(item => item !== itemToRemove));
    };

    const onSelectItem = (item: string) => {
        setQuery(item);
        handleSearch(item);
    };

    return (
        <SafeViewWrapper>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <SearchHeader
                    query={query}
                    setQuery={setQuery}
                    onClear={() => {
                        setQuery("");
                        setResults([]);
                    }}
                    onSubmit={() => handleSearch(query)}
                />

                {query.length > 0 && (
                    <FilterBar
                        selectedSort={selectedSort}
                        onSortChange={handleSortChange}
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
                            results={results}
                            loading={loading}
                            onItemPress={(id) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }}
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

