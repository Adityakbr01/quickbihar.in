import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
import { ChevronDown, CircleX, Search, Zap } from "lucide-react";
import { AppIcon } from "@/src/components/common/AppIcon";
import React, { useMemo } from "react";
import { DealProductCard } from "../components/DealProductCard";
import { DealProductSkeleton } from "../components/DealProductSkeleton";
import { FilterBottomSheet } from "../components/FilterBottomSheet";
import { FILTERS } from "../lib/dealsConfig";
import { TextInput } from "@/src/theme/components/TextInput";
import { cn } from "@/src/lib/utils";


export const MoreDealsFilters = ({
  theme: propTheme,
  activeFilter,
  setActiveFilter,
  setActiveDropdownType,
  setDropdownVisible,
  searchQuery,
  setSearchQuery,
  selectedCategoryOptions,
  selectedGenderOptions,
  categoryPillLabel,
  genderPillLabel,
  clearFilterSelections,
  isDesktop: propIsDesktop,
}: any) => {
  const hookTheme = useTheme();
  const theme = propTheme || hookTheme;
  const winW = useWindowWidth();
  const isDesktop = propIsDesktop ?? winW >= BREAKPOINTS.desktopMin;

  // Dynamic filter pills with resolved display labels
  const dynamicFilters = useMemo(
    () =>
      FILTERS.map((f) => {
        if (f.title === "Categories") {
          return {
            ...f,
            displayTitle: categoryPillLabel,
            hasSelection: selectedCategoryOptions.length > 0,
          };
        }
        if (f.title === "Gender") {
          return {
            ...f,
            displayTitle: genderPillLabel,
            hasSelection: selectedGenderOptions.length > 0,
          };
        }
        return { ...f, displayTitle: f.title, hasSelection: false };
      }),
    [
      categoryPillLabel,
      genderPillLabel,
      selectedCategoryOptions,
      selectedGenderOptions,
    ],
  );

  return (
    <div
      className={cn(
        "z-10 mb-6 pb-3",
        isDesktop && "mt-2 rounded-[20px] border px-0 pt-4 pb-4 shadow-xl",
      )}
      style={{
        backgroundColor: theme.background,
        ...(isDesktop ? { borderColor: theme.border } : null),
      }}
    >
      {/* Search bar — mobile only. Desktop uses the navbar search;
          the deals card keeps filters alone. */}
      {!isDesktop && (
        <div className="pt-3.5 mb-4.5 px-6">
          <TextInput
            placeholder="Search products, brands..."
            placeholderTextColor={theme.tertiaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
            selectionColor={theme.primary}
            icon={
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full"
                style={{ backgroundColor: theme.tertiaryBackground }}
              >
                <Search
                  size={17}
                  color={searchQuery ? theme.primary : theme.secondaryText}
                />
              </span>
            }
            rightIcon={
              <>
                {searchQuery.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mr-1 cursor-pointer p-1"
                    aria-label="Clear search"
                  >
                    <CircleX size={20} color={theme.secondaryText} />
                  </button>
                ) : null}
              </>
            }
            containerStyle={{ marginBottom: 0 }}
            inputContainerStyle={{
              backgroundColor: theme.secondaryBackground,
              borderRadius: 50,
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderWidth: 1,
            }}
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: "500",
              letterSpacing: -0.2,
            }}
          />

          {searchQuery.length > 0 && (
            <div className="mt-2.5 flex flex-row items-center px-1.5">
              <Zap size={13} color={theme.primary} />
              <p
                className="ml-1.5 text-xs font-medium"
                style={{ color: theme.secondaryText }}
              >
                Showing results for{" "}
                <span className="font-bold" style={{ color: theme.primary }}>
                  "{searchQuery}"
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter pills */}
      <div
        className={cn(
          "flex flex-row gap-2.5 overflow-x-auto px-6",
          isDesktop && "gap-3 px-5",
        )}
        style={{ scrollbarWidth: "none" }}
      >
        {dynamicFilters.map((filter) => {
          const isActive =
            activeFilter.title === filter.title || filter.hasSelection;
          const isDropdown =
            filter.title === "Gender" || filter.title === "Categories";

          return (
            <button
              key={filter.title}
              type="button"
              onClick={() => {
                setActiveFilter({ title: filter.title, icon: filter.icon });
                if (isDropdown) {
                  setActiveDropdownType(
                    filter.title as "Gender" | "Categories",
                  );
                  setDropdownVisible(true);
                }
              }}
              className="flex shrink-0 cursor-pointer flex-row items-center gap-1.5 rounded-full border px-4 py-2"
              style={{
                borderColor: isActive ? theme.primary : theme.border,
                backgroundColor: isActive ? theme.primary : theme.background,
              }}
            >
              {filter.icon && (
                <AppIcon
                  icon={filter.icon}
                  size={14}
                  // Active pill bg is lime primary (#80c314): near-black
                  // icon/text keeps ≥4.5:1 (white on lime is ~2.1:1).
                  color={isActive ? "#142000" : theme.iconColor}
                />
              )}
              <span
                className="text-[13px] font-semibold"
                style={{ color: isActive ? "#142000" : theme.text }}
              >
                {filter.displayTitle}
              </span>
              {isDropdown && (
                <ChevronDown
                  size={14}
                  color={isActive ? "#142000" : theme.iconColor}
                />
              )}
            </button>
          );
        })}

        {/* One-tap reset — only when gender/category selections are active */}
        {(selectedGenderOptions.length > 0 ||
          selectedCategoryOptions.length > 0) && (
          <button
            type="button"
            onClick={() => clearFilterSelections?.()}
            className="flex shrink-0 cursor-pointer flex-row items-center gap-1.5 rounded-full border px-4 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.secondaryBackground,
            }}
          >
            <CircleX size={14} color={theme.secondaryText} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: theme.secondaryText }}
            >
              Reset
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────

export const MoreDealsGrid = ({
  cardWidth,
  activeDropdownType,
  dropdownVisible,
  setDropdownVisible,
  currentOptionsList,
  categoryGroups,
  selectedGenderOptions,
  selectedCategoryOptions,
  handleApply,
  allProducts,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  theme: propTheme,
  isDesktop: propIsDesktop,
}: any) => {
  const hookTheme = useTheme();
  const theme = propTheme || hookTheme;
  const winW = useWindowWidth();
  const isDesktop = propIsDesktop ?? winW >= BREAKPOINTS.desktopMin;

  return (
    <div
      className={cn(
        "flex flex-row flex-wrap justify-start gap-3 px-4",
        isDesktop && "gap-5 px-0",
      )}
      style={isDesktop ? { rowGap: 28 } : { rowGap: 24 }}
    >
      {isLoading && !allProducts.length ? (
        [1, 2, 3, 4, 5, 6].map((key) => (
          <DealProductSkeleton key={key} width={cardWidth} />
        ))
      ) : allProducts.length > 0 ? (
        allProducts.map((product: any) => (
          <DealProductCard
            key={product._id}
            product={product}
            width={cardWidth}
          />
        ))
      ) : (
        <div className="flex w-full flex-col items-center py-15">
          <Search size={48} color={theme.tertiaryText} />
          <p
            className="mt-4 text-base font-semibold"
            // Same per-theme contrast rule as the hint below (secondaryText
            // is ~3.5:1 on the dark bg).
            style={{
              color:
                (theme as any)?.isDark ?? theme?.text === "#ffffff"
                  ? "#c7c7cc"
                  : "#3a3a3c",
            }}
          >
            No products found
          </p>
          <p
            className="mt-2 px-10 text-center text-sm"
            // tertiaryText (#636366) is only 3.2:1 on the dark bg —
            // dark needs #a1a1a6 (≈5.3:1), light keeps #636366 (≈5.9:1).
            style={{
              color:
                (theme as any)?.isDark ?? theme?.text === "#ffffff"
                  ? "#a1a1a6"
                  : "#636366",
            }}
          >
            {
              "Try adjusting your search or filters to find what you're looking for."
            }
          </p>
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full cursor-pointer p-5 text-center"
        >
          {isFetchingNextPage ? (
            <span
              className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{
                borderColor: `${theme.primary}40`,
                borderTopColor: theme.primary,
              }}
            />
          ) : (
            <span className="font-semibold" style={{ color: theme.primary }}>
              Load More
            </span>
          )}
        </button>
      )}

      {activeDropdownType && (
        <FilterBottomSheet
          visible={dropdownVisible}
          onClose={() => setDropdownVisible(false)}
          title={activeDropdownType}
          options={currentOptionsList}
          categoryGroups={
            activeDropdownType === "Categories" ? categoryGroups : undefined
          }
          initialSelected={
            activeDropdownType === "Gender"
              ? selectedGenderOptions
              : selectedCategoryOptions
          }
          onApply={handleApply}
        />
      )}
    </div>
  );
};

// Fallback for legacy imports
const MoreDealsSection = () => (
  <p>Please use the destructured components for MoreDealsSection directly</p>
);

export default MoreDealsSection;
