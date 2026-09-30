import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import LazyLottie from "@/src/components/common/LazyLottie";
import React, { useRef } from "react";
import { BREAKPOINTS, DESKTOP, useWindowWidth } from "@/src/utils/responsive";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/ProductCardSkeleton";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import * as Haptics from "@/lib/haptics";
import {
  getPublicProductsRequest,
  getTrendingProductsRequest,
} from "../../product/api/product.api";
import { IProduct } from "../../product/types/product.types";

const arrowLottie = "/lottie/arrow.json";

const CARD_WIDTH = 240;
const GAP = 12;

const TopSellingSection = ({ category }: { category?: string } = {}) => {
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const isDesktop = windowWidth >= BREAKPOINTS.desktopMin;
  // Mobile: 240px card but shrink on very small phones / foldables so at
  // least a 48px peek of the next card stays visible (no overflow).
  const mobileCardWidth = Math.min(CARD_WIDTH, Math.max(windowWidth - 96, 180));
  const scrollRef = useRef<HTMLDivElement>(null);
  const desktopGap = 20;
  const desktopContainer = Math.min(windowWidth - DESKTOP.gutter * 2, DESKTOP.maxWidth - 48);
  const desktopCardWidth = isDesktop ? (desktopContainer - desktopGap * 3) / 4 : mobileCardWidth;

  // Desktop rail position + arrow scrolling (2 cards per click).
  const scrollRail = (dir: 1 | -1) => {
    const step = (desktopCardWidth + desktopGap) * 2;
    scrollRef.current?.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const handleSeeAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goTo(navigate, {
      pathname: "/top-selling",
      params: category ? { category } : undefined,
    });
  };

  const { data: trendingProducts, isLoading } = useQuery({
    queryKey: ["trendingProducts", category],
    // Prefer the dedicated trending endpoint (it ranks by actual sales +
    // ratings + trending flag) and fall back to the public feed with
    // isTrending=true when there aren't enough sales-ranked products.
    queryFn: async () => {
      const [primaryRes, fallbackRes] = await Promise.allSettled([
        getTrendingProductsRequest(category ? { category } : undefined),
        getPublicProductsRequest({
          limit: 5,
          sortBy: "trending",
          category: category || undefined,
          isTrending: "true",
        }),
      ]);

      const primary: { data: IProduct[]; total: number } =
        primaryRes.status === "fulfilled"
          ? primaryRes.value
          : { data: [], total: 0 };
      if (primary.data.length >= 5) return primary;

      const fallback: { data: IProduct[]; total: number } =
        fallbackRes.status === "fulfilled"
          ? fallbackRes.value
          : { data: [], total: 0 };
      if (fallback.data.length > primary.data.length) {
        return fallback;
      }
      return primary;
    },
  });

  const products = (trendingProducts?.data || []).slice(0, 5);

  if (isLoading) {
    return (
      <section className="mt-6 overflow-hidden rounded-t-[32px] py-5" style={{ backgroundColor: theme.secondaryBackground }}>
        <div className="flex flex-row gap-3 overflow-hidden px-4 pb-2">
          {[1, 2, 3].map((key) => (
            <div key={key} className="shrink-0" style={{ width: mobileCardWidth }}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!trendingProducts || trendingProducts.total === 0) {
    return null;
  }

  return (
    <section className="mt-6 overflow-hidden rounded-t-[32px] py-5" style={{ backgroundColor: theme.secondaryBackground }}>
      <div className="mb-6 flex flex-row items-center justify-between px-5">
        <div className="flex flex-row items-center">
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: theme.text }}>
            Top Selling
          </h2>
          <div
            className="flex h-8 w-8 items-center justify-center overflow-hidden pt-2.5"
            style={{ filter: theme.text === "#ffffff" ? "invert(1)" : "none" }}
          >
            <LazyLottie
              key={theme.text}
              source={arrowLottie}
              autoPlay
              loop
              resizeMode="contain"
              // NOTE: dark-theme invert lives on the wrapper above
              style={{ width: "100%", height: "100%" }}
              colorFilters={
                theme.text === "#ffffff"
                  ? [
                      { keypath: "Shape Layer 2.Shape 1.Stroke 1", color: "#ffffff" },
                      { keypath: "Shape Layer 2.Shape 2.Stroke 1", color: "#ffffff" },
                      { keypath: "**", color: "#ffffff" },
                    ]
                  : []
              }
            />
          </div>
        </div>
        <button
          type="button"
          aria-label="See all top selling clothing"
          title="See all top selling clothing and fashion in Bihar"
          onClick={handleSeeAll}
          className="cursor-pointer p-1 text-sm font-semibold"
          style={{ color: theme.iconColor }}
        >
          See All
        </button>
      </div>

      {isDesktop ? (
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex flex-row gap-5 overflow-x-auto px-6 pb-2"
            style={{ scrollbarWidth: "none" }}
          >
            {products.slice(0, 5).map((item: any) => (
              <div key={item._id || item.id} className="shrink-0" style={{ width: desktopCardWidth }}>
                <ProductCard item={item} desktopWidth={desktopCardWidth} />
              </div>
            ))}
          </div>
          {/* Desktop rail arrows — one line, scrollable both ways. */}
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            aria-label="Scroll top selling left"
            className="absolute top-[38%] left-7 z-[5] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-lg"
            style={{ backgroundColor: theme.background, borderColor: theme.border }}
          >
            <span aria-hidden="true" className="-mt-1 text-[26px] leading-[30px] font-extrabold" style={{ color: theme.text }}>‹</span>
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            aria-label="Scroll top selling right"
            className="absolute top-[38%] right-7 z-[5] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-lg"
            style={{ backgroundColor: theme.background, borderColor: theme.border }}
          >
            <span aria-hidden="true" className="-mt-1 text-[26px] leading-[30px] font-extrabold" style={{ color: theme.text }}>›</span>
          </button>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex flex-row overflow-x-auto scroll-px-4 px-4 pb-2"
          style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
        >
          {products.map((item: any, index: number) => (
            <div
              key={item._id || item.id}
              className="shrink-0"
              style={{
                width: mobileCardWidth,
                marginRight: index === products.length - 1 ? 0 : GAP,
                scrollSnapAlign: "start",
              }}
            >
              <ProductCard item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TopSellingSection;
