import HomeCategories from "@/src/features/common/category/components/HomeCategories";
import { cn } from "@/src/lib/utils";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
import { useCallback, useState } from "react";
import { DesktopFooter } from "../components/DesktopFooter";
import HomeHeader from "../components/HomeHeader";
import { MoreDealsHeader } from "../components/MoreDealsHeader";
import TopHomeCarousel from "../components/TopHomeCarousel";
import {
  MoreDealsFilters,
  MoreDealsGrid,
  useMoreDealsLogic,
} from "../sections/MoreDealsSection";
import TopMallSection from "../sections/TopMallSection";
import TopSellingSection from "../sections/TopSellingSection";

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
    <section className="flex-1">
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
            <TopMallSection />
            <TopSellingSection />
            <div className="mt-3 w-full lg:mt-5">
              <TopHomeCarousel placement="home_middle" />
            </div>
            <MoreDealsHeader {...moreDealsState} />
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
          <MoreDealsFilters {...moreDealsState} />
        </div>

        {/* Product Grid */}
        <div
          className={cn("w-full", isWide && "mx-auto max-w-[1280px] px-6")}
          style={{ minHeight: "70vh" }}
        >
          <MoreDealsGrid {...moreDealsState} />
        </div>

        {isDesktop ? <DesktopFooter /> : null}
      </div>
    </section>
  );
};

export default HomeScreen;
