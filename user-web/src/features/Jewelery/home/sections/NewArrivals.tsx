import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import { SectionHeader } from "../components/SectionHeader";
import { Spinner } from "../components/Spinner";
import { useJeweleryNewArrivals } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * New arrivals horizontal product rail with a loading state.
 * Extracted from JeweleryHomeScreen (`NewArrivals`).
 * Preserves fetch limit (8), empty/loading handling, and navigation.
 */
export function NewArrivals() {
  const navigate = useNavigate();
  const colors = useColors();
  const isDark = colors.isDark;
  const { data: newItems = [], isLoading } = useJeweleryNewArrivals(8);
  if (!isLoading && newItems.length === 0) return null;
  return (
    <div
      className="p-5"
      style={{ backgroundColor: isDark ? colors.card : colors.champagne }}
    >
      <SectionHeader
        label="JUST IN"
        title="New Arrivals"
        onSeeAll={() => goTo(navigate, "/jewelery/collections" as any)}
      />
      {isLoading ? (
        <div className="mt-4 flex justify-center">
          <Spinner color={colors.gold} />
        </div>
      ) : (
        <div className="mt-4 flex flex-row gap-3 overflow-x-auto pb-1 pr-5">
          {newItems.map((i) => (
            <div key={i.id} className="w-[164px] shrink-0">
              <ProductCard
                product={i}
                style={{ width: 164, marginRight: 12 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NewArrivals;
