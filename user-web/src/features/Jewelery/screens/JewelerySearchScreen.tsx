import { Search, X } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import { useJewelerySearch } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { goBack } from "@/src/utils/navigation";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { TextInput } from "@/src/theme/components/TextInput";
import { trackSearchResults } from "@/src/analytics/googleAnalytics";

const popularSearches = [
  "Gold pendant",
  "Jhumka earrings",
  "Bridal necklace",
  "Diamond ring",
  "Meenakari bangle",
  "Everyday wear",
];

function Spinner({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2"
      style={{
        width: size,
        height: size,
        borderColor: color,
        borderTopColor: "transparent",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

function dismissKeyboard() {
  const el = document.activeElement;
  if (el instanceof HTMLElement) el.blur();
}

export default function JewelerySearchScreen() {
  const navigate = useNavigate();
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const topPad = 16;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data: pages, isLoading } = useJewelerySearch(debounced);
  const filtered = useMemo(
    () => (pages?.pages ?? []).flatMap((pg) => pg.data),
    [pages]
  );
  const total = pages?.pages?.[0]?.total ?? filtered.length;

  // GA4 view_search_results — fires once per distinct debounced term when
  // its results are known (real query + result count, catalog jewellery).
  const searchTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    const term = debounced.trim();
    if (!term || isLoading) return;
    if (searchTrackedRef.current === term) return;
    searchTrackedRef.current = term;
    trackSearchResults(term, total, "jewellery");
  }, [debounced, isLoading, total]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: colors.ivory }}
    >
      <div
        className="flex flex-row items-center gap-3 border-b px-4 pb-3.5"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
          borderBottomWidth: 1,
        }}
      >
        <TextInput value={query}
          onChangeText={setQuery}
          placeholder="Search for jewellery..."
          placeholderTextColor={colors.warmGray}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={dismissKeyboard}
          icon={<Search size={16} color={colors.warmGray} />}
          rightIcon={
            query.length > 0 ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="cursor-pointer"
                aria-label="Clear search"
              >
                <X size={16} color={colors.warmGray} />
              </button>
            ) : undefined
          }
          focusBorderColor={colors.gold}
          containerStyle={{ marginBottom: 0, flex: 1 }}
          inputContainerStyle={{
            backgroundColor: colors.pearl,
            borderWidth: 0.5,
            borderRadius: 2,
            paddingHorizontal: 12,
            paddingVertical: 10,
            minHeight: 44,
          }}
          style={{
            fontSize: 14,
            color: colors.ink,
            fontFamily: "DMSans_400Regular",
          }}
        />
        <button
          type="button"
          className="cursor-pointer"
          onClick={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goBack(navigate);
          }}
        >
          <span
            className="text-[13px]"
            style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
          >
            Cancel
          </span>
        </button>
      </div>

      {query.trim() === "" ? (
        <div className="flex flex-col gap-3.5 p-5">
          <span
            className="text-[9px] tracking-[2px]"
            style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
          >
            POPULAR SEARCHES
          </span>
          <div className="flex flex-row flex-wrap gap-2">
            {popularSearches.map((s) => (
              <button
                key={s}
                type="button"
                className="cursor-pointer rounded-full border px-3.5 py-2 transition-colors active:opacity-80"
                style={{
                  borderColor: colors.midGray,
                  borderWidth: 1,
                  backgroundColor: "transparent",
                }}
                onClick={() => {
                  Haptics.selectionAsync();
                  setQuery(s);
                }}
              >
                <span
                  className="text-sm"
                  style={{
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_400Regular_Italic",
                  }}
                >
                  {s}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10">
          <Spinner color={colors.gold} />
          <span
            className="text-center text-sm"
            style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
          >
            Searching the vault...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10">
          <Search size={32} color={colors.midGray} />
          <span
            className="text-center text-[22px]"
            style={{
              color: colors.ink,
              fontFamily: "CormorantGaramond_500Medium_Italic",
            }}
          >
            No results for &ldquo;{query}&rdquo;
          </span>
          <span
            className="text-center text-sm"
            style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
          >
            Try a different search term
          </span>
        </div>
      ) : (
        <div className="overflow-y-auto">
          <div className="flex flex-col gap-3 p-4">
            <span
              className="text-xs"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              {total} piece{total !== 1 ? "s" : ""} found
            </span>
            <div className="flex flex-row flex-wrap justify-between gap-2">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
