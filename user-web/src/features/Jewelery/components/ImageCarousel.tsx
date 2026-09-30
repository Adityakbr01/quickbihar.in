import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import React, { useRef, useState } from "react";
import { cn } from "@/src/lib/utils";
import { useWindowWidth } from "@/src/utils/responsive";

import { useColors } from "@/src/features/Jewelery/hooks/useColors";

interface ImageCarouselProps {
  images: any[];
  /** Product name for SEO alt/title (PDP passes it; falls back gracefully). */
  productName?: string;
}

function resolveSrc(source: any): string | undefined {
  if (!source) return undefined;
  if (typeof source === "string") return source;
  if (typeof source === "object" && typeof source.uri === "string") return source.uri;
  return source as any;
}

export function ImageCarousel({ images, productName }: ImageCarouselProps) {
  const colors = useColors();
  // Live viewport width — a module-level Dimensions.get() goes stale on
  // resize/device-emulation/rotation and makes images wider than the
  // screen, which stretches the whole page (incl. the sticky action bar).
  const windowWidth = useWindowWidth();
  const width = windowWidth;
  // Square 1:1 gallery — the old 4:3 frame was far too tall and pushed
  // the details + Add to Bag bar way down the page.
  const imageHeight = width;
  const [activeIndex, setActiveIndex] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const scrollLock = useRef(false);

  const scrollToIndex = (index: number) => {
    const el = mainRef.current;
    if (el) {
      scrollLock.current = true;
      el.scrollTo({ left: index * width, behavior: "smooth" });
      window.setTimeout(() => {
        scrollLock.current = false;
      }, 350);
    }
    const thumb = thumbRef.current;
    if (thumb) {
      const thumbSize = 68;
      thumb.scrollTo({
        left: Math.max(0, index * thumbSize - thumb.clientWidth / 2 + thumbSize / 2),
        behavior: "smooth",
      });
    }
  };

  const onMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollLock.current) return;
    const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
    const index = Math.round(scrollLeft / width);
    setActiveIndex((prev) => (prev === index ? prev : index));
  };

  const handleThumbPress = (index: number) => {
    setActiveIndex(index);
    scrollToIndex(index);
  };

  const safeImages = (images ?? []).filter(Boolean);
  if (safeImages.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          height: imageHeight,
          backgroundColor: colors.champagne,
        }}
      >
        <ImageIcon size={40} color={colors.gold} />
      </div>
    );
  }

  return (
    <div>
      {/* Main image pager */}
      <div className="relative" style={{ height: imageHeight }}>
        <div
          ref={mainRef}
          onScroll={onMainScroll}
          className="flex h-full w-full snap-x snap-mandatory flex-row overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {safeImages.map((item, i) => {
            const src = resolveSrc(item);
            const label = productName
              ? `${productName} photo ${i + 1} - Shop Online in Bihar`
              : `Jewellery product photo ${i + 1} - Shop Online in Bihar`;
            const heading = productName
              ? `${productName} | QuickBihar Jewellery`
              : "QuickBihar Jewellery";
            return (
              <div
                key={String(i)}
                className="h-full shrink-0 snap-center"
                style={{ width, height: imageHeight }}
              >
                {src ? (
                  <img
                    src={src}
                    alt={label}
                    title={heading}
                    className="h-full w-full object-cover"
                    draggable={false}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={i === 0 ? "high" : "low"}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Dot indicators overlay */}
        <div
          className="absolute right-0 bottom-3.5 left-0 flex flex-row items-center justify-center gap-1.5"
          style={{ pointerEvents: "none" }}
        >
          {safeImages.map((_, i) => (
            <span
              key={i}
              className="h-[5px] rounded-full"
              style={{
                backgroundColor:
                  i === activeIndex
                    ? colors.gold
                    : "rgba(247,243,236,0.5)",
                width: i === activeIndex ? 18 : 6,
              }}
            />
          ))}
        </div>

        {/* Counter badge */}
        <div
          className="absolute top-3.5 right-3.5 flex flex-row items-center rounded-xl px-2 py-1"
          style={{ backgroundColor: `${colors.ink}8C` }}
        >
          <ImageIcon size={10} color={colors.onBrand} />
          <span
            className="ml-1 text-[10px] font-semibold"
            style={{ color: colors.onBrand }}
          >
            {activeIndex + 1}/{safeImages.length}
          </span>
        </div>

        {/* Left / right arrows */}
        {activeIndex > 0 && (
          <button
            type="button"
            onClick={() => handleThumbPress(activeIndex - 1)}
            aria-label="Previous image"
            className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full"
            style={{ backgroundColor: `${colors.pearl}D9` }}
          >
            <ChevronLeft size={18} color={colors.ink} />
          </button>
        )}
        {activeIndex < safeImages.length - 1 && (
          <button
            type="button"
            onClick={() => handleThumbPress(activeIndex + 1)}
            aria-label="Next image"
            className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full"
            style={{ backgroundColor: `${colors.pearl}D9` }}
          >
            <ChevronRight size={18} color={colors.ink} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {safeImages.length > 1 && (
        <div className="py-2.5" style={{ backgroundColor: colors.pearl }}>
          <div
            ref={thumbRef}
            className="flex flex-row gap-2 overflow-x-auto px-4"
            style={{ scrollbarWidth: "none" }}
          >
            {safeImages.map((item, index) => {
              const src = resolveSrc(item);
              const active = index === activeIndex;
              return (
                <button
                  key={`thumb-${index}`}
                  type="button"
                  onClick={() => handleThumbPress(index)}
                  aria-label={`View image ${index + 1}`}
                  className={cn("h-[60px] w-[60px] shrink-0 cursor-pointer overflow-hidden rounded-[2px] border")}
                  style={{
                    borderColor: active ? colors.gold : "transparent",
                    borderWidth: active ? 2 : 1,
                    opacity: active ? 1 : 0.6,
                  }}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={
                        productName
                          ? `${productName} thumbnail ${index + 1}`
                          : `Jewellery thumbnail ${index + 1}`
                      }
                      className="h-full w-full object-cover"
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
