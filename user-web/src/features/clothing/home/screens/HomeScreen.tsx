import HomeCategories from "@/src/features/common/category/components/HomeCategories";
import { cn } from "@/src/lib/utils";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
import { Suspense, lazy, useCallback, useState } from "react";
import HomeHeader from "../components/HomeHeader";
import TopHomeCarousel from "../components/TopHomeCarousel";
import { useMoreDealsLogic } from "../sections/useMoreDealsLogic";

// Below-fold sections — lazy so the entry chunk stays lean (first paint is
// hero carousel + categories only). Each fallback reserves vertical space to
// keep CLS at 0 while the chunk loads.
const TopMallSection = lazy(() => import("../sections/TopMallSection"));
const TopSellingSection = lazy(
  () => import("../sections/TopSellingSection"),
);
const MoreDealsHeader = lazy(() => import("../components/MoreDealsHeader"));
const MoreDealsFilters = lazy(() =>
  import("../sections/MoreDealsSection").then((m) => ({
    default: m.MoreDealsFilters,
  })),
);
const MoreDealsGrid = lazy(() =>
  import("../sections/MoreDealsSection").then((m) => ({
    default: m.MoreDealsGrid,
  })),
);
const DesktopFooter = lazy(() => import("../components/DesktopFooter"));

function SectionFallback({ minHeight }: { minHeight: number }) {
  return (
    <div
      aria-hidden="true"
      className="w-full animate-pulse rounded-2xl bg-black/5"
      style={{ minHeight }}
    />
  );
}

const HomeScreen = ({ rootSlug }: { rootSlug?: string }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen((v) => !v);
  }, []);

  const moreDealsState = useMoreDealsLogic();

  const width = useWindowWidth();
  const isDesktop = width >= BREAKPOINTS.desktopMin;
  const isWide = width >= BREAKPOINTS.tabletMin;

  return (
    <main className="flex-1">
      {/* Single H1 per page (audit: missing-h1) — visually hidden, crawlable. */}
      <h1 className="sr-only">
        QuickBihar — Online Clothes Shopping in Buxar, Bihar with 60–120 min Delivery
      </h1>
      <div
        className={cn("flex flex-col", isWide && "items-center")}
        style={{ paddingBottom: isDesktop ? 24 : 100 }}
      >
        {/* Everything before the filter tabs */}
        <div className="w-full overflow-hidden">
          <div className={cn(isWide && "mx-auto w-full max-w-[1280px] px-6")}>
            <HomeHeader menuOpen={menuOpen} toggleMenu={toggleMenu} />

            <div className="mt-3 w-full lg:mt-5">
              <TopHomeCarousel />
            </div>
            <HomeCategories rootSlug={rootSlug} />
            <Suspense fallback={<SectionFallback minHeight={280} />}>
              <TopMallSection />
            </Suspense>
            <Suspense fallback={<SectionFallback minHeight={320} />}>
              <TopSellingSection />
            </Suspense>
            <div className="mt-3 w-full lg:mt-5">
              <TopHomeCarousel placement="home_middle" />
            </div>
            <Suspense fallback={<SectionFallback minHeight={120} />}>
              <MoreDealsHeader {...moreDealsState} />
            </Suspense>
          </div>
        </div>

        {/* Filter tabs (sticky on mobile; on desktop the top
              DesktopNavbar is the persistent chrome) */}
          <div
            className={cn(
              "w-full",
              // z-30: card overlays (discount badge z-10, rating pill)
              // paint over the bar at equal z-index since they come
              // later in the DOM — keep the stuck bar strictly above.
              !isDesktop && "sticky top-0 z-30",
              isWide && "mx-auto max-w-[1280px] px-6",
            )}
          >
          <Suspense fallback={<SectionFallback minHeight={52} />}>
            <MoreDealsFilters {...moreDealsState} />
          </Suspense>
        </div>

        {/* Product Grid */}
        <div
          className={cn("w-full", isWide && "mx-auto max-w-[1280px] px-6")}
          style={{ minHeight: "70vh" }}
        >
          <Suspense fallback={null}>
            <MoreDealsGrid {...moreDealsState} />
          </Suspense>
        </div>

        {isDesktop ? (
          <Suspense fallback={null}>
            <DesktopFooter />
          </Suspense>
        ) : null}
      </div>
    </main>
  );
};

export default HomeScreen;
