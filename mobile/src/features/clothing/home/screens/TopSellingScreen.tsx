import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { IProduct } from "@/src/features/clothing/product/types/product.types";
import { getPublicProductsRequest } from "@/src/features/clothing/product/api/product.api";
import { DealProductCard } from "../components/DealProductCard";
import {
  Sheet,
  SheetHeader,
  useSheet,
} from "@/src/components/common/BottomSheet";

const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 16;

type SortKey = "trending" | "price-asc" | "price-desc" | "rating" | "newest";
type GenderFilter = "ALL" | "Men" | "Women" | "Kids";

interface SortOption {
  key: SortKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "trending", label: "Trending Now", icon: "flame" },
  { key: "price-asc", label: "Price: Low to High", icon: "trending-up" },
  { key: "price-desc", label: "Price: High to Low", icon: "trending-down" },
  { key: "rating", label: "Top Rated", icon: "star" },
  { key: "newest", label: "Newest First", icon: "time" },
];

/**
 * Maps the in-app SortKey to the values the backend `findAll` accepts
 * for the `sortBy` query param (see product.dao.ts → findAll).
 * When "trending" is selected we also force `isTrending=true` so we only
 * show products that have been flagged as trending — not every product
 * sorted to the top.
 */
const SORT_PARAM: Record<SortKey, string> = {
  trending: "trending",
  "price-asc": "price_low",
  "price-desc": "price_high",
  rating: "rating",
  newest: "newest",
};

const GENDER_CHIPS: { key: GenderFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "ALL", label: "All", icon: "apps" },
  { key: "Men", label: "Men", icon: "man" },
  { key: "Women", label: "Women", icon: "woman" },
  { key: "Kids", label: "Kids", icon: "people" },
];

const useTopSellingProducts = (
  category: string | undefined,
  sortBy: SortKey,
  gender: GenderFilter,
) => {
  return useInfiniteQuery({
    queryKey: ["top-selling", category, sortBy, gender],
    queryFn: async ({ pageParam = 1 }) => {
      return getPublicProductsRequest({
        page: pageParam,
        limit: 12,
        sortBy: SORT_PARAM[sortBy],
        category: category || undefined,
        gender: gender === "ALL" ? undefined : gender,
        // When "Trending Now" is selected, restrict to products flagged
        // as trending. For other sorts we show all public products.
        isTrending: sortBy === "trending" ? "true" : undefined,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.length * 12;
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

interface TopSellingScreenProps {
  category?: string;
}

const TopSellingScreen: React.FC<TopSellingScreenProps> = ({ category }) => {
  const theme = useTheme();
  const router = useRouter();
  const sortSheet = useSheet();
  const [sortBy, setSortBy] = useState<SortKey>("trending");
  const [gender, setGender] = useState<GenderFilter>("ALL");
  const [refreshing, setRefreshing] = useState(false);
  // Live width so rotation / foldables / small phones never overflow.
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.max(
    (windowWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2,
    140,
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useTopSellingProducts(category, sortBy, gender);

  const products: IProduct[] = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );
  const total = data?.pages?.[0]?.total ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleSortSelect = (key: SortKey) => {
    // State first, haptics second (guarded): on web haptics can throw, and it
    // must never block the filter from applying.
    setSortBy(key);
    Haptics.selectionAsync().catch(() => null);
    sortSheet.current?.dismiss();
  };

  const handleGenderSelect = (g: GenderFilter) => {
    setGender(g);
    Haptics.selectionAsync().catch(() => null);
  };

  const handleOpenSort = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    sortSheet.current?.present();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/clothing/home" as any);
  };

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: theme.secondaryBackground }]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Top Selling
            </Text>
            <View style={[styles.fireBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="flame" size={11} color="#fff" />
            </View>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>
            {total > 0
              ? `${total} ${total === 1 ? "trending item" : "trending items"}`
              : "Most loved by Bihar"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleOpenSort}
          style={[styles.sortBtn, { backgroundColor: theme.secondaryBackground }]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="swap-vertical" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Gender chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {GENDER_CHIPS.map((chip) => {
          const isActive = gender === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              onPress={() => handleGenderSelect(chip.key)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive
                    ? theme.primary
                    : theme.secondaryBackground,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
            >
              <Ionicons
                name={chip.icon}
                size={14}
                color={isActive ? "#fff" : theme.text}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? "#fff" : theme.text },
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort hint pill */}
      <View style={styles.sortHintRow}>
        <Text style={[styles.sortHint, { color: theme.secondaryText }]}>
          Sorted by{" "}
          <Text style={{ color: theme.text, fontWeight: "600" }}>
            {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
          </Text>
        </Text>
        <TouchableOpacity
          onPress={handleOpenSort}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.changeLink, { color: theme.primary }]}>
            Change
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyWrap}>
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: theme.secondaryBackground },
          ]}
        >
          <Ionicons name="flame-outline" size={42} color={theme.tertiaryText} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          Nothing trending here yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
          Try a different filter or check back soon — fresh drops land every day.
        </Text>
        <TouchableOpacity
          onPress={() => {
            setGender("ALL");
            setSortBy("trending");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
          }}
          style={[styles.emptyResetBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyResetText}>Reset Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      );
    }
    if (!hasNextPage && products.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <View
            style={[styles.footerEndDivider, { backgroundColor: theme.border }]}
          />
          <Text style={[styles.footerEndText, { color: theme.tertiaryText }]}>
            {"You've seen it all 🎉"}
          </Text>
          <View
            style={[styles.footerEndDivider, { backgroundColor: theme.border }]}
          />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeViewWrapper>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {renderHeader()}

        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={isLoading ? null : renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              Haptics.selectionAsync().catch(() => null);
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isLoading}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.secondaryBackground}
            />
          }
          renderItem={({ item }) => (
            <DealProductCard product={item} width={cardWidth} />
          )}
        />

        {/* Sort Sheet */}
        <Sheet
          ref={sortSheet}
          detents={["auto"]}
          onDidDismiss={() => {}}
          backgroundColor={theme.background}
        >
          <SheetHeader
            title="Sort By"
            onClose={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
              sortSheet.current?.dismiss();
            }}
          />
          <View style={styles.sortSheetContent}>
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => handleSortSelect(opt.key)}
                  activeOpacity={0.7}
                  style={[
                    styles.sortOption,
                    {
                      backgroundColor: isActive
                        ? theme.primary + "12"
                        : theme.secondaryBackground,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.sortOptionIcon,
                      {
                        backgroundColor: isActive
                          ? theme.primary
                          : theme.tertiaryBackground,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={isActive ? "#fff" : theme.text}
                    />
                  </View>
                  <Text
                    style={[
                      styles.sortOptionLabel,
                      {
                        color: isActive ? theme.primary : theme.text,
                        fontWeight: isActive ? "700" : "500",
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Sheet>
      </View>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  headerWrap: {
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  fireBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  sortBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sortHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sortHint: {
    fontSize: 12,
  },
  changeLink: {
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 4,
    paddingBottom: 24,
    flexGrow: 1,
  },
  columnWrapper: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyResetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyResetText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: "center",
  },
  footerEnd: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  footerEndDivider: {
    flex: 1,
    height: 1,
  },
  footerEndText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sortSheetContent: {
    padding: 16,
    gap: 10,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  sortOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sortOptionLabel: {
    flex: 1,
    fontSize: 15,
  },
});

export default TopSellingScreen;
