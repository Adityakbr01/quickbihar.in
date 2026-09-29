import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpDown, ChevronLeft, CircleCheck, Clock, Flame, LayoutGrid, Star, TrendingDown, TrendingUp, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { goBack } from "@/src/utils/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import * as Haptics from "@/lib/haptics";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { IProduct } from "@/src/features/clothing/product/types/product.types";
import { getPublicProductsRequest } from "@/src/features/clothing/product/api/product.api";
import { DealProductCard } from "../components/DealProductCard";
import { AppSheet } from "@/src/components/common/AppSheet";

const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 16;

type SortKey = "trending" | "price-asc" | "price-desc" | "rating" | "newest";
type GenderFilter = "ALL" | "Men" | "Women" | "Kids";

interface SortOption {
  key: SortKey;
  label: string;
  icon: LucideIcon;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "trending", label: "Trending Now", icon: Flame },
  { key: "price-asc", label: "Price: Low to High", icon: TrendingUp },
  { key: "price-desc", label: "Price: High to Low", icon: TrendingDown },
  { key: "rating", label: "Top Rated", icon: Star },
  { key: "newest", label: "Newest First", icon: Clock },
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

const GENDER_CHIPS: { key: GenderFilter; label: string; icon: LucideIcon }[] = [
  { key: "ALL", label: "All", icon: LayoutGrid },
  { key: "Men", label: "Men", icon: User },
  { key: "Women", label: "Women", icon: User },
  { key: "Kids", label: "Kids", icon: Users },
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
  const navigate = useNavigate();
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("trending");
  const [gender, setGender] = useState<GenderFilter>("ALL");
  const [refreshing, setRefreshing] = useState(false);
  // Live width so rotation / foldables / small phones never overflow.
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
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

  // Infinite scroll — IntersectionObserver on the sentinel.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          Haptics.selectionAsync().catch(() => null);
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, products.length]);

  const handleSortSelect = (key: SortKey) => {
    // State first, haptics second (guarded): on web haptics can throw, and it
    // must never block the filter from applying.
    setSortBy(key);
    Haptics.selectionAsync().catch(() => null);
    setSortOpen(false);
  };

  const handleGenderSelect = (g: GenderFilter) => {
    setGender(g);
    Haptics.selectionAsync().catch(() => null);
  };

  const handleOpenSort = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    setSortOpen(true);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    goBack(navigate, "/(tabs)/clothing/home");
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-20">
        <div
          className="mb-5 flex h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.secondaryBackground }}
        >
          <Flame size={42} color={theme.tertiaryText} />
        </div>
        <p className="mb-2 text-center text-lg font-extrabold" style={{ color: theme.text }}>
          Nothing trending here yet
        </p>
        <p className="mb-6 text-center text-sm leading-5" style={{ color: theme.secondaryText }}>
          Try a different filter or check back soon — fresh drops land every day.
        </p>
        <button
          type="button"
          onClick={() => {
            setGender("ALL");
            setSortBy("trending");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
          }}
          className="cursor-pointer rounded-3xl px-6 py-3 text-sm font-bold text-white"
          style={{ backgroundColor: theme.primary }}
        >
          Reset Filters
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-1 flex-col" style={{ backgroundColor: theme.background }}>
        <div className="z-10">
          <div
            className="flex flex-row items-center border-b px-4 pt-3.5 pb-3"
            style={{ backgroundColor: theme.background, borderBottomColor: theme.border }}
          >
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
              style={{ backgroundColor: theme.secondaryBackground }}
            >
              <ChevronLeft size={22} color={theme.text} />
            </button>
            <div className="ml-3 flex-1">
              <div className="flex flex-row items-center gap-1.5">
                <h1 className="text-xl font-extrabold tracking-tight" style={{ color: theme.text }}>
                  Top Selling
                </h1>
                <span
                  className="flex h-[18px] w-[18px] items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.primary }}
                >
                  <Flame size={11} color="#fff" />
                </span>
              </div>
              <p className="mt-px text-[11px] font-medium" style={{ color: theme.secondaryText }}>
                {total > 0
                  ? `${total} ${total === 1 ? "trending item" : "trending items"}`
                  : "Most loved by Bihar"}
              </p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh products"
              className="mr-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: theme.secondaryBackground, color: theme.text }}
            >
              <span className={refreshing || isLoading ? "animate-spin" : ""}>↻</span>
            </button>
            <button
              type="button"
              onClick={handleOpenSort}
              aria-label="Open sort options"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
              style={{ backgroundColor: theme.secondaryBackground }}
            >
              <ArrowUpDown size={18} color={theme.text} />
            </button>
          </div>

          {/* Gender chips */}
          <div className="flex flex-row gap-2 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: "none" }}>
            {GENDER_CHIPS.map((chip) => {
              const isActive = gender === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleGenderSelect(chip.key)}
                  className="flex shrink-0 cursor-pointer flex-row items-center gap-1.5 rounded-full border px-3.5 py-2"
                  style={{
                    backgroundColor: isActive ? theme.primary : theme.secondaryBackground,
                    borderColor: isActive ? theme.primary : theme.border,
                  }}
                >
                  <chip.icon size={14} color={isActive ? "#fff" : theme.text} />
                  <span className="text-[13px] font-semibold" style={{ color: isActive ? "#fff" : theme.text }}>
                    {chip.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort hint pill */}
          <div className="flex flex-row items-center justify-between px-4 pb-2.5">
            <p className="text-xs" style={{ color: theme.secondaryText }}>
              Sorted by{" "}
              <span className="font-semibold" style={{ color: theme.text }}>
                {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
              </span>
            </p>
            <button
              type="button"
              onClick={handleOpenSort}
              className="cursor-pointer text-xs font-bold"
              style={{ color: theme.primary }}
            >
              Change
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          renderEmpty()
        ) : (
          <div className="grid flex-1 grid-cols-2 gap-3 px-4 pt-1 pb-6">
            {products.map((item) => (
              <DealProductCard key={item._id} product={item} width={cardWidth} />
            ))}
          </div>
        )}

        {/* Infinite-scroll sentinel + footer */}
        <div ref={sentinelRef} />
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center py-6">
            <span
              className="block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${theme.primary}40`, borderTopColor: theme.primary }}
            />
          </div>
        ) : null}
        {!hasNextPage && products.length > 0 ? (
          <div className="flex flex-row items-center gap-3 px-4 py-6">
            <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
            <p className="text-xs font-semibold" style={{ color: theme.tertiaryText }}>
              {"You've seen it all 🎉"}
            </p>
            <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
          </div>
        ) : null}

        {/* Sort dialog */}
        <AppSheet
          visible={sortOpen}
          onClose={() => setSortOpen(false)}
          title="Sort By"
          label="Sort by"
        >
          <div className="flex flex-col gap-2.5 px-4 pb-4">
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortBy === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSortSelect(opt.key)}
                  className="flex cursor-pointer flex-row items-center gap-3 rounded-[14px] border-[1.5px] p-3.5"
                  style={{
                    backgroundColor: isActive ? theme.primary + "12" : theme.secondaryBackground,
                    borderColor: isActive ? theme.primary : theme.border,
                  }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: isActive ? theme.primary : theme.tertiaryBackground }}
                  >
                    <opt.icon size={18} color={isActive ? "#fff" : theme.text} />
                  </span>
                  <span
                    className="flex-1 text-left text-[15px]"
                    style={{ color: isActive ? theme.primary : theme.text, fontWeight: isActive ? 700 : 500 }}
                  >
                    {opt.label}
                  </span>
                  {isActive && <CircleCheck size={20} color={theme.primary} />}
                </button>
              );
            })}
          </div>
        </AppSheet>
      </div>
    </>
  );
};

export default TopSellingScreen;
