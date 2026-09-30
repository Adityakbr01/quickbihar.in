import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import * as Haptics from "@/lib/haptics";
import { useTrackClick } from "@/src/features/common/banner/hooks/useBanners";
import { Banner } from "@/src/features/common/banner/types/banner.types";
import { cn } from "@/src/lib/utils";
import { bannerWidthBucket, ikUrl } from "@/src/lib/images";

interface CarouselSlideProps {
  item: Banner;
  index: number;
  /** Desktop frame is much wider than the uploaded creative — render the
   * full image fitted instead of cover-cropping it. */
  desktop?: boolean;
  /** Rendered carousel width in px (drives the ImageKit w- bucket). */
  width?: number;
}

const CarouselSlide = ({ item, index, desktop, width }: CarouselSlideProps) => {
  // Slide 0 is the LCP candidate: eager + high priority. The rest stay out
  // of the critical path (lazy + low priority + async decode).
  const isFirst = (index ?? 1) === 0;
  // ImageKit resizing + auto-format (WebP/AVIF): phones fetch a 768px
  // variant instead of the full creative. No backend change needed.
  const src = ikUrl(item.image, {
    width: bannerWidthBucket(width ?? (desktop ? 1280 : 390)),
  });
  const navigate = useNavigate();
  const trackClick = useTrackClick();
  const [pressed, setPressed] = useState(false);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Track click analytics
    trackClick.mutate(item._id);

    // Real-world redirection logic
    switch (item.redirectType) {
      case "category":
        goTo(navigate, {
          pathname: "/(tabs)/clothing/search" as any,
          params: {
            categoryId: item.redirectId || "",
            categoryName: item.title || "",
          },
        });
        break;
      case "collection":
        goTo(navigate, {
          pathname: "/(tabs)/clothing/search" as any,
          params: { query: item.title || "" },
        });
        break;
      case "product":
        if (item.redirectId) {
          goTo(navigate, {
            pathname: "/product/[id]" as any,
            params: { id: item.redirectId },
          });
        }
        break;
      case "external":
        if (item.externalUrl) {
          window.open(item.externalUrl, "_blank");
        }
        break;
      default:
        console.warn(`Unhandled redirection type: ${item.redirectType}`);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <button
        type="button"
        onClick={handlePress}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        aria-label={item.title || "QuickBihar Fashion Sale Banner"}
        title={item.title || "QuickBihar Online Fashion Offer"}
        className={cn(
          "h-full w-full overflow-hidden transition-opacity",
          desktop ? "rounded-[22px] bg-[#101012]" : "rounded-2xl bg-transparent",
        )}
        style={{ opacity: pressed ? 0.85 : 1 }}
      >
        <img
          src={src}
          alt={item.title || "QuickBihar Fashion Sale Banner"}
          title={item.title || "QuickBihar Online Fashion Deals"}
          className="h-full w-full"
          style={{ objectFit: desktop ? "contain" : "cover", borderRadius: desktop ? 22 : 16 }}
          loading={isFirst ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={isFirst ? "high" : "low"}
        />
      </button>
    </div>
  );
};

export default CarouselSlide;
