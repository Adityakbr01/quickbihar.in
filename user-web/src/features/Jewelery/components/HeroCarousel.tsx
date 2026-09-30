import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/src/lib/utils";
import { useWindowWidth } from "@/src/utils/responsive";
import Carousel from "@/src/components/common/EmblaCarousel";

import { APP_CURRENCY } from "@/src/constants";
import type { Product } from "@/src/features/Jewelery/data/products";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

const AUTO_SCROLL_INTERVAL = 4500;

interface HeroSlide {
  id: string;
  image?: any;
  label: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaRoute: string;
  secondaryCta?: string;
}

const BRAND_SLIDES: HeroSlide[] = [
  {
    id: "s1",
    label: "NEW ARRIVALS — SUMMER EDIT",
    headline: "For the woman\nwho wears gold\nlike a second skin.",
    body: "Handcrafted fine jewellery rooted in Indian tradition.",
    ctaLabel: "Explore the Collection →",
    ctaRoute: "/jewelery/collections",
    secondaryCta: "Shop Bridal →",
  },
  {
    id: "s2",
    label: "BRIDAL 2026",
    headline: "Because you've\nimagined this moment\nsince you were seven.",
    body: "Sacred. Heirloom. Forever. Our bridal collection awaits.",
    ctaLabel: "Explore Bridal →",
    ctaRoute: "/jewelery/collections",
    secondaryCta: "Book a Consultation →",
  },
  {
    id: "s3",
    label: "FESTIVE EDIT",
    headline: "For the nights that\nsmell like agarbatti\nand feel like magic.",
    body: "Kundan, polki and gold — curated for every celebration.",
    ctaLabel: "Shop Festive →",
    ctaRoute: "/jewelery/collections",
    secondaryCta: "Book a Consultation →",
  },
  {
    id: "s4",
    label: "STATEMENT PIECES",
    headline: "Not subtle.\nNot sorry.\nJust gold.",
    body: "Bold artisan pieces for the woman who commands attention.",
    ctaLabel: "Shop Statement →",
    ctaRoute: "/jewelery/collections",
  },
];

function resolveSrc(source: any): string | undefined {
  if (!source) return undefined;
  if (typeof source === "string") return source;
  if (typeof source === "object" && typeof source.uri === "string") return source.uri;
  return source as any;
}

/**
 * Hero carousel powered by Embla for butter-smooth snapping,
 * responsive resizing, and authentic luxury presentation.
 */
export function HeroCarousel({ items }: { items?: Product[] }) {
  const colors = useColors();
  const windowWidth = useWindowWidth();
  const [activeIndex, setActiveIndex] = useState(0);

  const carouselWidth = windowWidth;
  const carouselHeight = Math.min(Math.max(windowWidth * 1.15, 380), 500);

  const withPhotos = (items ?? []).filter((p) => p.image);
  const slides: HeroSlide[] = withPhotos.length
    ? withPhotos.slice(0, 4).map((p) => ({
        id: `p-${p.id}`,
        image: p.image,
        label: p.collection?.toUpperCase() || "FEATURED",
        headline: p.name,
        body: `${p.subtitle} · ${APP_CURRENCY}${p.price.toLocaleString("en-IN")}`,
        ctaLabel: "Shop This Piece →",
        ctaRoute: `/jewelery/product/${p.id}`,
      }))
    : BRAND_SLIDES;

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: carouselWidth, height: carouselHeight }}
    >
      <Carousel<HeroSlide>
        width={carouselWidth}
        height={carouselHeight}
        data={slides}
        autoPlay
        loop
        autoPlayInterval={AUTO_SCROLL_INTERVAL}
        onSnapToItem={(index: number) => setActiveIndex(index)}
        renderItem={({ item }: { item: HeroSlide }) => {
          const src = resolveSrc(item.image);
          return (
            <div
              className="relative overflow-hidden"
              style={{ width: carouselWidth, height: carouselHeight }}
            >
              {src ? (
                <img
                  src={src}
                  alt={`${item.headline} - Shop Online in Bihar`}
                  title={`${item.headline} | QuickBihar Jewellery`}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={activeIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ) : (
                <div
                  className="absolute inset-0 h-full w-full"
                  style={{ backgroundColor: colors.emerald }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(18, 15, 13, 0.45)" }}
              />
              <div className="absolute right-0 bottom-0 left-0 flex flex-col gap-2.5 p-6 pb-12">
                <span
                  className="text-[9px] tracking-[2px]"
                  style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                >
                  {item.label}
                </span>
                <span
                  className={cn("line-clamp-3 text-[28px] leading-[34px] whitespace-pre-line")}
                  style={{
                    color: "#F7F3EC",
                    fontFamily: "CormorantGaramond_300Light_Italic",
                  }}
                >
                  {item.headline}
                </span>
                <span
                  className="line-clamp-2 text-[13px] leading-5"
                  style={{
                    color: "rgba(247,243,236,0.85)",
                    fontFamily: "DMSans_300Light",
                  }}
                >
                  {item.body}
                </span>
                <div className="mt-1 flex flex-col gap-2.5">
                  <Link
                    to={item.ctaRoute}
                    className="cursor-pointer self-start rounded-[1px] border px-5 py-3 transition-colors hover:bg-[rgba(184,146,74,0.18)] active:bg-[rgba(184,146,74,0.18)]"
                    style={{ borderColor: colors.gold, backgroundColor: "transparent" }}
                  >
                    <span
                      className="text-xs tracking-[1px]"
                      style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
                    >
                      {item.ctaLabel}
                    </span>
                  </Link>
                  {item.secondaryCta && (
                    <Link
                      to={item.ctaRoute}
                      className="cursor-pointer self-start"
                    >
                      <span
                        className="text-xs tracking-[1px]"
                        style={{
                          color: "rgba(247,243,236,0.7)",
                          fontFamily: "DMSans_400Regular",
                        }}
                      >
                        {item.secondaryCta}
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Dot indicators */}
      <div
        className="absolute bottom-4 left-6 flex flex-row items-center gap-1.5"
        style={{ pointerEvents: "none" }}
      >
        {slides.map((s, i) => (
          <span
            key={s.id ?? i}
            className="h-1.5 rounded-full"
            style={{
              backgroundColor:
                i === activeIndex
                  ? colors.gold
                  : "rgba(247,243,236,0.45)",
              width: i === activeIndex ? 20 : 6,
            }}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div
        className="absolute right-5 bottom-[18px]"
        style={{ pointerEvents: "none" }}
      >
        <span
          className="text-[10px] tracking-[1px]"
          style={{
            color: "rgba(247,243,236,0.6)",
            fontFamily: "DMSans_400Regular",
          }}
        >
          {activeIndex + 1} / {slides.length}
        </span>
      </div>
    </div>
  );
}
