import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import { SectionHeader } from "../components/SectionHeader";
import { Spinner } from "../components/Spinner";
import { useJeweleryBestsellers } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Bestsellers / most-loved product grid with a loading state.
 * Extracted from JeweleryHomeScreen (`BestsellerSection`).
 * Preserves fetch limit (6), empty/loading handling, and navigation.
 */
export function BestsellerSection() {
  const navigate = useNavigate();
  const colors = useColors();
  const { data: bestsellers = [], isLoading } = useJeweleryBestsellers(6);
  if (!isLoading && bestsellers.length === 0) return null;
  return (
    <div className="p-5" style={{ backgroundColor: colors.ivory }}>
      <SectionHeader
        label="MOST LOVED"
        title="Bestsellers"
        onSeeAll={() => goTo(navigate, "/jewelery/collections" as any)}
      />
      <div className="mt-4 flex flex-row flex-wrap justify-between gap-2">
        {isLoading ? (
          <div className="flex flex-1 justify-center py-6">
            <Spinner color={colors.gold} />
          </div>
        ) : (
          bestsellers.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </div>
  );
}

export default BestsellerSection;
