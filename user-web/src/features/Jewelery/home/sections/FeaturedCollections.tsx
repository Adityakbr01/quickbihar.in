import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { CollectionCard } from "../components/CollectionCard";
import { SectionHeader } from "../components/SectionHeader";
import { useJeweleryCategories } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { resolveJeweleryCollectionImage } from "@/src/features/Jewelery/data/collectionImages";
import type { Collection } from "@/src/features/Jewelery/data/collections";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Curated collections row (top 3 categories) with a "See all" link to
 * /jewelery/collections.
 * Extracted from JeweleryHomeScreen (`FeaturedCollections`).
 * Preserves data mapping, layout, and navigation destination.
 */
export function FeaturedCollections() {
  const navigate = useNavigate();
  const colors = useColors();
  const { data: cats } = useJeweleryCategories();
  const top: Collection[] = (cats ?? []).slice(0, 3).map((c) => {
    const imgUri = resolveJeweleryCollectionImage(c);
    return {
      id: c._id,
      name: c.title,
      tagline: "",
      mood: "",
      pieceCount: 0,
      image: imgUri ? { uri: imgUri } : null,
    };
  });
  if (!top.length) return null;
  return (
    <div className="p-5" style={{ backgroundColor: colors.ivory }}>
      <SectionHeader
        label="CURATED FOR YOU"
        title="Our Collections"
        onSeeAll={() => goTo(navigate, "/jewelery/collections" as any)}
      />
      <div className="mt-4 flex h-[320px] flex-row gap-2.5">
        <CollectionCard collection={top[0]} large style={{ flex: 1 }} />
        {top.length > 1 && (
          <div className="flex flex-[0.6] flex-col gap-2.5">
            {top.slice(1).map((c) => (
              <CollectionCard key={c.id} collection={c} style={{ flex: 1 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeaturedCollections;
