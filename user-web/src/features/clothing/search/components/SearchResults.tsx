import React, { useEffect, useRef } from "react";
import { Shirt, Star } from "lucide-react";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
import { IProduct } from "../../product/types/product.types";
import { cn } from "@/src/lib/utils";

interface SearchResultsProps {
  results: IProduct[];
  loading: boolean;
  onItemPress: (id: string) => void;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
}

const SearchResults = ({
  results,
  loading,
  onItemPress,
  onEndReached,
  isFetchingNextPage
}: SearchResultsProps) => {
  const theme = useTheme();
  const winW = useWindowWidth();
  const isDesktop = winW >= BREAKPOINTS.desktopMin;
  const isTablet = winW >= BREAKPOINTS.tabletMin && !isDesktop;
  // Mobile stays exactly 2 columns; tablet 3, desktop 4.
  // Column width is live (rotation / foldables / small phones safe):
  // 16px list padding each side + 16px inter-column gap.
  const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const gap = isDesktop ? 20 : 16;
  const listPadding = 32;
  const colWidth = isDesktop || isTablet
    ? (Math.min(winW - 48, 1280 - 48) - gap * (numColumns - 1)) / numColumns
    : Math.max((winW - listPadding - gap / 2) / 2, 140);

  // Infinite scroll — the old FlatList onEndReached never fired on web,
  // so only the first page ever rendered. IntersectionObserver fixes that.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !onEndReached) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onEndReached();
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onEndReached, results.length]);

  if (loading && results.length === 0) {
    return (
      <div
        className="flex flex-row flex-wrap gap-4 p-4"
        style={(isDesktop || isTablet) ? { maxWidth: 1280, marginLeft: "auto", marginRight: "auto", width: "100%" } : undefined}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="mb-4 animate-pulse" style={{ width: colWidth }}>
            <div className="mb-2 aspect-[3/4] w-full rounded-xl" style={{ backgroundColor: theme.tertiaryBackground }} />
            <div className="mb-1.5 h-3.5 rounded" style={{ backgroundColor: theme.tertiaryBackground, width: "80%" }} />
            <div className="h-3.5 rounded" style={{ backgroundColor: theme.tertiaryBackground, width: "50%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0 && !loading) {
    return (
      <div className="mt-10 flex flex-1 flex-col items-center justify-center p-10">
        <Shirt size={60} color={theme.tertiaryText} />
        <p className="mt-4 text-center text-base" style={{ color: theme.secondaryText }}>
          No items found for your search.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn("grid gap-4 p-4")}
        style={{
          gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`,
          ...(isDesktop || isTablet ? { maxWidth: 1280, marginLeft: "auto", marginRight: "auto", width: "100%" } : null),
        }}
      >
        {results.map((item, index) => (
          <button
            key={item._id}
            type="button"
            onClick={() => onItemPress(item.slug || item._id)}
            className="cursor-pointer overflow-hidden rounded-xl text-left"
            style={{
              width: "100%",
              maxWidth: colWidth,
              backgroundColor: theme.background,
              marginBottom: isDesktop || isTablet ? 24 : 16,
              marginLeft: (isDesktop || isTablet)
                ? (index % numColumns) === 0 ? 0 : gap / 2
                : index % 2 === 0 ? 0 : 8,
              marginRight: (isDesktop || isTablet)
                ? (index % numColumns) === numColumns - 1 ? 0 : gap / 2
                : index % 2 === 0 ? 8 : 0,
            }}
          >
            <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl">
              <img src={item.images?.[0]?.url} alt={`${item.title} - Shop Online in Bihar`} title={`${item.title} | QuickBihar`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              {item.discountPercentage > 0 && (
                <span
                  className="absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  {Math.round(item.discountPercentage)}% OFF
                </span>
              )}
              {item.ratings && (
                <span className="absolute right-2 bottom-2 flex flex-row items-center gap-0.5 rounded-[10px] bg-white/90 px-1.5 py-0.5">
                  <Star size={10} color="#FFD700" fill="#FFD700" />
                  <span className="text-[10px] font-bold text-black">{item.ratings.average.toFixed(1)}</span>
                </span>
              )}
            </span>

            <span className="block py-2">
              <span className="block truncate text-sm font-medium" style={{ color: theme.text }}>
                {item.title}
              </span>
              <span className="mt-1 flex flex-row items-center gap-1.5">
                <span className="text-[15px] font-bold" style={{ color: theme.text }}>₹{item.price.toLocaleString()}</span>
                {item.originalPrice > item.price && (
                  <span className="text-xs line-through" style={{ color: theme.tertiaryText }}>
                    ₹{item.originalPrice.toLocaleString()}
                  </span>
                )}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div ref={sentinelRef} />
      {isFetchingNextPage ? (
        <div className="flex items-center justify-center py-5">
          <span
            className="block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: `${theme.primary}40`, borderTopColor: theme.primary }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default SearchResults;
