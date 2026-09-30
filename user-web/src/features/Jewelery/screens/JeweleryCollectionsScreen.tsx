import { Package, Search } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React, { useMemo, useState } from "react";
import { cn } from "@/src/lib/utils";

import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import { useJeweleryCategories, useJeweleryProducts } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { resolveJeweleryCollectionImage } from "@/src/features/Jewelery/screens/JeweleryHomeScreen";

function Spinner({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2"
      style={{
        width: size,
        height: size,
        borderColor: color,
        borderTopColor: "transparent",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

export default function JeweleryCollectionsScreen() {
  const navigate = useNavigate();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("All");
  const topPad = 16;

  const { data: cats } = useJeweleryCategories();
  const collectionTabs = useMemo(
    () => ["All", ...((cats ?? []).map((c) => c.title))],
    [cats]
  );
  const chips = useMemo(
    () => (cats ?? []).map((c) => {
      const imgUri = resolveJeweleryCollectionImage(c);
      return { id: c._id, name: c.title, image: imgUri || null };
    }),
    [cats]
  );

  const {
    data: pages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useJeweleryProducts({ category: activeTab === "All" ? undefined : activeTab });
  const filtered = useMemo(
    () => (pages?.pages ?? []).flatMap((pg) => pg.data),
    [pages]
  );

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: colors.ivory }}
    >
      <div
        className="flex flex-row items-center justify-between border-b px-5 pb-3.5"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
          borderBottomWidth: 1,
        }}
      >
        <h1
          className="text-[22px] tracking-[3px]"
          style={{ color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" }}
        >
          Collections
        </h1>
        <button
          type="button"
          className="cursor-pointer"
          onClick={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goTo(navigate, "/jewelery/search" as any);
          }}
          aria-label="Search jewellery"
        >
          <Search size={20} color={colors.ink} />
        </button>
      </div>

      <div className="overflow-y-auto">
        {/* Collections hero grid */}
        <div className="p-5" style={{ backgroundColor: colors.pearl }}>
          <span
            className="block text-[9px] tracking-[2px]"
            style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
          >
            OUR WORLD
          </span>
          <h2
            className="mt-3 text-[24px] leading-[30px]"
            style={{
              color: colors.ink,
              fontFamily: "CormorantGaramond_400Regular_Italic",
            }}
          >
            Five worlds. One story.
          </h2>
          <div className="mt-3 flex flex-row gap-2.5 overflow-x-auto pb-1 pr-1">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                className="relative h-[180px] w-[140px] shrink-0 cursor-pointer overflow-hidden rounded-[2px] transition-opacity active:opacity-85"
                onClick={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(c.name);
                }}
              >
                {c.image && (
                  <img
                    src={c.image}
                    alt={`${c.name} jewellery collection - Shop Online in Bihar`}
                    title={`${c.name} | QuickBihar Jewellery`}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: "rgba(26,22,20,0.32)" }}
                />
                <div className="absolute inset-x-2.5 bottom-2.5">
                  <span
                    className="block text-[16px] leading-5"
                    style={{
                      color: "#F7F3EC",
                      fontFamily: "CormorantGaramond_500Medium_Italic",
                    }}
                  >
                    {c.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div
          className="border-b"
          style={{
            backgroundColor: colors.ivory,
            borderBottomColor: colors.midGray,
            borderBottomWidth: 1,
          }}
        >
          <div className="flex flex-row overflow-x-auto px-4">
            {collectionTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className="mr-1 cursor-pointer px-3 py-3.5"
                style={{
                  borderBottomWidth: activeTab === tab ? 1.5 : 0,
                  borderBottomColor: colors.gold,
                  borderBottomStyle: "solid",
                }}
                onClick={() => setActiveTab(tab)}
              >
                <span
                  className="text-xs tracking-[0.3px]"
                  style={{
                    color: activeTab === tab ? colors.gold : colors.warmGray,
                    fontFamily:
                      activeTab === tab
                        ? "DMSans_500Medium"
                        : "DMSans_400Regular",
                  }}
                >
                  {tab}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="p-4" style={{ backgroundColor: colors.ivory }}>
          <div className="flex flex-row flex-wrap justify-between gap-2">
            {isLoading ? (
              <div className="flex flex-1 justify-center py-10">
                <Spinner color={colors.gold} />
              </div>
            ) : (
              filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-[60px]">
              <Package size={32} color={colors.midGray} />
              <span
                className="text-sm"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                No pieces found in this collection
              </span>
            </div>
          )}
          {hasNextPage && !isLoading && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className={cn(
                "flex w-full cursor-pointer items-center justify-center py-4",
                isFetchingNextPage && "opacity-60",
              )}
            >
              {isFetchingNextPage ? (
                <Spinner color={colors.gold} />
              ) : (
                <span
                  className="text-xs tracking-[1px]"
                  style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                >
                  LOAD MORE
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
