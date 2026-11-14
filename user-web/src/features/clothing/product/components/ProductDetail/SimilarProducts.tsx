import React from "react";
import { ProductCard } from "@/src/features/clothing/home/components/ProductCard";
import { BREAKPOINTS, DESKTOP, useWindowWidth } from "@/src/utils/responsive";
import { IProduct } from "../../types/product.types";

interface SimilarProductsProps {
  products: IProduct[];
  theme: any;
}

/**
 * Responsive card width mirrors the "Top Selling" rail on the clothing
 * home so both sections show the exact same ProductCard at the same size.
 */
const CARD_WIDTH = 240;
const MOBILE_GAP = 12;

export const SimilarProducts = ({ products, theme }: SimilarProductsProps) => {
  const windowWidth = useWindowWidth();
  const isDesktop = windowWidth >= BREAKPOINTS.desktopMin;

  // Mobile: 240px card but shrink on very small phones so a peek of the
  // next card stays visible. Desktop: four cards fill the rail.
  const mobileCardWidth = Math.min(CARD_WIDTH, Math.max(windowWidth - 96, 180));
  const desktopGap = 20;
  const desktopContainer = Math.min(
    windowWidth - DESKTOP.gutter * 2,
    DESKTOP.maxWidth - 48,
  );
  const cardWidth = isDesktop
    ? (desktopContainer - desktopGap * 3) / 4
    : mobileCardWidth;

  if (!products || products.length === 0) return null;

  return (
    <section className="py-4" style={{ backgroundColor: theme.background }}>
      <h2
        className="px-4 text-[13px] font-bold tracking-[0.8px]"
        style={{ color: theme.text }}
      >
        SIMILAR PRODUCTS
      </h2>
      <div
        className="mt-3 flex flex-row overflow-x-auto scroll-px-4 px-4 pb-2"
        style={{
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          gap: isDesktop ? desktopGap : MOBILE_GAP,
        }}
      >
        {products.map((item) => (
          <div
            key={item._id || item.slug}
            className="shrink-0"
            style={{ width: cardWidth, scrollSnapAlign: "start" }}
          >
            <ProductCard
              item={item}
              desktopWidth={isDesktop ? cardWidth : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
