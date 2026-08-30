import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import Animated, { FadeInDown } from "react-native-reanimated";

import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { IProduct } from "@/src/features/clothing/product/types/product.types";
import { getPublicProductsRequest } from "@/src/features/clothing/product/api/product.api";
import { useWishlistStore } from "@/src/features/common/wishlist/store/wishlistStore";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import {
  Sheet,
  SheetHeader,
  useSheet,
} from "@/src/components/common/BottomSheet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleSortSelect = (key: SortKey) => {
    Haptics.selectionAsync();
    setSortBy(key);
    sortSheet.current?.dismiss();
  };

  const handleGenderSelect = (g: GenderFilter) => {
    Haptics.selectionAsync();
    setGender(g);
  };

  const handleOpenSort = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sortSheet.current?.present();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setGender("ALL");
            setSortBy("trending");
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
            You've seen it all 🎉
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
              Haptics.selectionAsync();
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
          renderItem={({ item, index }) => (
            <ProductGridCard product={item} index={index} />
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

interface ProductGridCardProps {
  product: IProduct;
  index: number;
}

const ProductGridCard: React.FC<ProductGridCardProps> = React.memo(
  ({ product, index }) => {
    const theme = useTheme();
    const router = useRouter();
    const toggleWishlist = useWishlistStore((s) => s.toggleItem);
    const isWishlisted = useWishlistStore((s) =>
      s.items.includes(product._id),
    );
    const addItem = useCartStore((s) => s.addItem);

    const imageUri = product.images?.[0]?.url;
    const hasDiscount =
      product.originalPrice && product.originalPrice > product.price;
    const discountPct = hasDiscount
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;
    const rating = Number(product.ratings?.average ?? 0);
    const ratingCount = Number(product.ratings?.count ?? 0);

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: "/product/[id]",
        params: { id: product._id },
      });
    };

    const handleWishlist = (e: any) => {
      e?.stopPropagation?.();
      Haptics.impactAsync(
        isWishlisted
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium,
      );
      toggleWishlist(product._id, product);
      Toast.show({
        type: isWishlisted ? "info" : "success",
        text1: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
        text2: product.title,
        position: "bottom",
        visibilityTime: 1500,
      });
    };

    const handleQuickAdd = (e: any) => {
      e?.stopPropagation?.();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const sku = product.variants?.[0]?.sku || product._id;
      addItem(product, sku, 1);
      Toast.show({
        type: "success",
        text1: "Added to Cart",
        text2: product.title,
        position: "bottom",
        visibilityTime: 1500,
      });
    };

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 40, 400))
          .springify()
          .damping(18)}
        style={[styles.cardOuter, { width: CARD_WIDTH }]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePress}
          style={[
            styles.card,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Image */}
          <View
            style={[
              styles.imageWrap,
              { backgroundColor: theme.secondaryBackground },
            ]}
          >
            {imageUri ? (
              <ExpoImage
                source={{ uri: imageUri }}
                style={styles.image}
                contentFit="cover"
                transition={250}
              />
            ) : (
              <View
                style={[
                  styles.image,
                  {
                    backgroundColor: theme.tertiaryBackground,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={theme.tertiaryText}
                />
              </View>
            )}

            {/* Discount badge */}
            {discountPct > 0 && (
              <View
                style={[
                  styles.discountBadge,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text style={styles.discountText}>
                  {discountPct}% OFF
                </Text>
              </View>
            )}

            {/* Trending badge */}
            {product.isTrending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="flame" size={10} color="#fff" />
                <Text style={styles.trendingText}>Trending</Text>
              </View>
            )}

            {/* Wishlist heart */}
            <TouchableOpacity
              onPress={handleWishlist}
              style={[
                styles.wishlistBtn,
                { backgroundColor: "rgba(255,255,255,0.92)" },
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={16}
                color={isWishlisted ? "#ef4444" : "#374151"}
              />
            </TouchableOpacity>

            {/* Quick add */}
            {product.totalStock > 0 && (
              <TouchableOpacity
                onPress={handleQuickAdd}
                style={[
                  styles.quickAddBtn,
                  { backgroundColor: theme.primary },
                ]}
                activeOpacity={0.8}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            {product.brand ? (
              <Text
                style={[styles.brand, { color: theme.tertiaryText }]}
                numberOfLines={1}
              >
                {product.brand.toUpperCase()}
              </Text>
            ) : null}

            <Text
              style={[styles.title, { color: theme.text }]}
              numberOfLines={2}
            >
              {product.title}
            </Text>

            {/* Price row */}
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: theme.text }]}>
                ₹{product.price.toLocaleString("en-IN")}
              </Text>
              {hasDiscount && (
                <Text
                  style={[
                    styles.originalPrice,
                    { color: theme.tertiaryText },
                  ]}
                >
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </Text>
              )}
            </View>

            {/* Rating */}
            {rating > 0 && (
              <View style={styles.ratingRow}>
                <View
                  style={[
                    styles.ratingPill,
                    { backgroundColor: theme.secondaryBackground },
                  ]}
                >
                  <Ionicons name="star" size={10} color="#f59e0b" />
                  <Text style={[styles.ratingText, { color: theme.text }]}>
                    {rating.toFixed(1)}
                  </Text>
                </View>
                {ratingCount > 0 && (
                  <Text
                    style={[styles.ratingCount, { color: theme.tertiaryText }]}
                  >
                    ({ratingCount})
                  </Text>
                )}
              </View>
            )}

            {/* Delivery pill */}
            {product.deliveryInfo?.isExpressAvailable && (
              <View
                style={[
                  styles.deliveryPill,
                  { backgroundColor: theme.primary + "15" },
                ]}
              >
                <Ionicons
                  name="flash"
                  size={9}
                  color={theme.primary}
                />
                <Text style={[styles.deliveryText, { color: theme.primary }]}>
                  30-Min
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);
ProductGridCard.displayName = "ProductGridCard";

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
  cardOuter: {},
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 0.78,
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  trendingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "rgba(239, 68, 68, 0.92)",
    gap: 2,
  },
  trendingText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  wishlistBtn: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAddBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    padding: 10,
  },
  brand: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
    minHeight: 34,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "700",
  },
  ratingCount: {
    fontSize: 10,
    fontWeight: "500",
  },
  deliveryPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  deliveryText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
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
