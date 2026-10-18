import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";

import { Header } from "../components/Header";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { HeroCarousel } from "../components/HeroCarousel";
import { BrandPillars } from "../sections/BrandPillars";
import { FeaturedCollections } from "../sections/FeaturedCollections";
import { NewArrivals } from "../sections/NewArrivals";
import { OccasionsSection } from "../sections/OccasionsSection";
import { HeritageSection } from "../sections/HeritageSection";
import { BestsellerSection } from "../sections/BestsellerSection";
import { FestiveCampaign } from "../sections/FestiveCampaign";
import { GiftingSection } from "../sections/GiftingSection";
import { FaqSection } from "../sections/FaqSection";
import { NewsletterSection } from "../sections/NewsletterSection";
import { useJeweleryBestsellers } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

export default function JeweleryHomeScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { data: heroItems } = useJeweleryBestsellers(4);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["jewelery-categories"] });
  }, [queryClient]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: colors.ivory }}
    >
      {/* Single H1 per page (audit: missing-h1) — matches prerender shell. */}
      <h1 className="sr-only">
        Buy Jewellery Online in Buxar, Bihar — BIS-Hallmarked Gold with Home
        Delivery | QuickBihar
      </h1>
      <Header />
      <div className="flex-1 pb-[calc(60px+env(safe-area-inset-bottom)+2rem)] md:pb-16">
        <AnnouncementBar />
        <HeroCarousel items={heroItems} />
        <BrandPillars />
        <FeaturedCollections />
        <NewArrivals />
        <OccasionsSection />
        <HeritageSection />
        <BestsellerSection />
        <FestiveCampaign />
        {/* Testimonials hidden until real verified reviews exist. */}
        <GiftingSection />
        <FaqSection />
        <NewsletterSection />
      </div>
    </div>
  );
}
