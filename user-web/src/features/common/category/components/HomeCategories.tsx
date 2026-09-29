import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
import React from "react";

import { useCategories } from "../hooks/useCategories";
import { Category } from "../types/category.types";
import CategorySkeleton from "./CategorySkeleton";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import * as Haptics from "@/lib/haptics";

const HomeCategories = ({ rootSlug = "clothing" }: { rootSlug?: string }) => {
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isDesktop = width >= BREAKPOINTS.desktopMin;
  const [showAll, setShowAll] = React.useState(false);
  const { data: rawCategories, isLoading, error } = useCategories({ vertical: "CLOTHING" });
  // Desktop rail scroll position + arrow stepping (3 tiles per click).
  const railRef = React.useRef<HTMLDivElement>(null);
  const railOffset = React.useRef(0);
  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollTo({
      // 112px tile + 18px gap per step × 3 tiles.
      left: Math.max(0, railOffset.current + dir * 390),
      behavior: "smooth",
    });
  };

  const renderItem = ({ item }: { item: Category }) => (
    <button
      type="button"
      onClick={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        goTo(navigate, {
          pathname: "/(tabs)/clothing/search" as any,
          params: {
            query: item.title,
            categoryName: item.title,
            subCategory: item.title,
            categoryId: item._id,
          },
        });
      }}
      aria-label={`Shop ${item.title}`}
      title={`Shop ${item.title} on QuickBihar`}
      className="flex w-[70px] shrink-0 flex-col items-center bg-transparent"
    >
      <div
        className="mb-1 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border"
        style={{ borderColor: theme.border, backgroundColor: "#f0f0f0" }}
      >
        <img
          src={item.image}
          alt={`${item.title} - Clothing Category in Bihar`}
          aria-label={`${item.title} Category`}
          title={`${item.title} | QuickBihar Online Shopping`}
          className="h-full w-full object-cover"
        />
      </div>
      <span className="line-clamp-1 text-center text-[11px] font-medium" style={{ color: theme.text }}>
        {item.title}
      </span>
    </button>
  );

  const { visibleCategories, totalCount } = React.useMemo(() => {
    if (!rawCategories || rawCategories.length === 0) return { visibleCategories: [], totalCount: 0 };

    // Filter only clothing categories (exclude Jewellery, etc.)
    const categories = rawCategories.filter((cat) => {
      if (cat.vertical && cat.vertical !== "CLOTHING") return false;
      const lower = cat.title.toLowerCase();
      return (
        !lower.includes("jewel") &&
        !lower.includes("necklace") &&
        !lower.includes("jhumka") &&
        !lower.includes("bangle") &&
        !lower.includes("earring") &&
        !lower.includes("ring") &&
        !lower.includes("food") &&
        !lower.includes("grocery") &&
        !lower.includes("accessori")
      );
    });

    // Find the root category (e.g. "clothing") if specified
    const targetSlug = (rootSlug || "clothing").toLowerCase();
    const rootCat = categories.find(
      (cat) =>
        cat.slug?.toLowerCase() === targetSlug ||
        cat.title?.toLowerCase() === targetSlug
    );

    let eligible: Category[];
    if (rootCat) {
      const childCategories = categories.filter((cat) => {
        const pId = typeof cat.parentId === "object" ? (cat.parentId as any)?._id : cat.parentId;
        return pId && pId.toString() === rootCat._id.toString();
      });
      eligible = childCategories.length > 0 ? childCategories : categories.filter((cat) => !cat.parentId);
    } else {
      eligible = categories.filter((cat) => !cat.parentId);
    }

    // Filter out categories explicitly marked as not visible on home
    const homeEligible = eligible.filter((cat) => cat.isVisibleOnHome !== false);

    // Sort by homePosition (1, 2, 3...) then priority (descending)
    homeEligible.sort((a, b) => {
      const posA = a.homePosition && a.homePosition > 0 ? a.homePosition : 999;
      const posB = b.homePosition && b.homePosition > 0 ? b.homePosition : 999;
      if (posA !== posB) return posA - posB;
      return (b.priority || 0) - (a.priority || 0);
    });

    const totalCount = homeEligible.length;
    const visibleCategories = showAll ? homeEligible : homeEligible.slice(0, 5);

    return { visibleCategories, totalCount };
  }, [rawCategories, rootSlug, showAll]);

  if (isLoading) {
    return (
      <div className="my-4">
        <div className="flex flex-row gap-4 overflow-x-auto px-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <CategorySkeleton key={item.toString()} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !rawCategories || visibleCategories.length === 0) {
    return null;
  }

  // Desktop web: premium centered grid (up to 10 tiles, larger artwork,
  // hover lift). Mobile path below is byte-identical to before.
  if (isDesktop) {
    const gridData = (showAll ? visibleCategories : visibleCategories.slice(0, 10));
    // Reuse the full eligible list when collapsed to 5 mobile items —
    // desktop shows more without an extra fetch.
    const desktopList = showAll
      ? gridData
      : (rawCategories || [])
          .filter((cat: any) => {
            if ((cat as any).vertical && (cat as any).vertical !== "CLOTHING") return false;
            const lower = String((cat as any).title || "").toLowerCase();
            return (
              !lower.includes("jewel") &&
              !lower.includes("food") &&
              !lower.includes("grocery") &&
              !lower.includes("accessori")
            );
          })
          .slice(0, 10);
    return (
      <div className="my-7 flex flex-col items-center px-6">
        {/* Left-aligned heading like mobile section headers. */}
        <div className="flex w-full max-w-[1080px] justify-start px-6">
          <h2 className="mb-5 text-left text-2xl font-black tracking-tight" style={{ color: theme.text }}>
            Shop by category
          </h2>
        </div>
        {/* Single scrollable rail — all tiles in one line, never wrapping. */}
        <div className="relative flex w-full max-w-[1080px] flex-col items-center">
          <div
            ref={railRef}
            onScroll={(e) => {
              railOffset.current = e.currentTarget.scrollLeft;
            }}
            className="flex w-full items-start gap-[18px] overflow-x-auto px-6 pb-2.5"
            style={{ scrollbarWidth: "none" }}
          >
          {desktopList.map((item: any) => (
            <button
              key={item._id}
              type="button"
              onClick={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                goTo(navigate, {
                  pathname: "/(tabs)/clothing/search" as any,
                  params: {
                    query: item.title,
                    categoryName: item.title,
                    subCategory: item.title,
                    categoryId: item._id,
                  },
                });
              }}
              aria-label={`Shop ${item.title}`}
              className="flex w-[112px] shrink-0 flex-col items-center bg-transparent"
            >
              <div
                className="flex h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-full border shadow-lg"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.secondaryBackground,
                }}
              >
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
              </div>
              <span className="mt-2.5 line-clamp-1 text-center text-[13px] font-bold" style={{ color: theme.text }}>
                {item.title}
              </span>
            </button>
          ))}
          </div>
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            aria-label="Scroll categories left"
            className="absolute top-8 left-7 z-[5] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-lg"
            style={{ backgroundColor: theme.background, borderColor: theme.border }}
          >
            <span className="-mt-[3px] text-[26px] font-extrabold leading-[30px]" style={{ color: theme.text }}>‹</span>
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            aria-label="Scroll categories right"
            className="absolute top-8 right-7 z-[5] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-lg"
            style={{ backgroundColor: theme.background, borderColor: theme.border }}
          >
            <span className="-mt-[3px] text-[26px] font-extrabold leading-[30px]" style={{ color: theme.text }}>›</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      <div className="flex flex-row gap-2 overflow-x-auto px-3">
        {visibleCategories.map((item) => (
          <React.Fragment key={item._id}>
            {renderItem({ item })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default HomeCategories;
