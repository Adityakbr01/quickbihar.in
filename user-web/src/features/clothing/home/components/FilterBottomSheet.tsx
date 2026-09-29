import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, CircleX, Layers, Search, X } from "lucide-react";
import { AppIcon } from "@/src/components/common/AppIcon";
import { AppSheet } from "@/src/components/common/AppSheet";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

export interface FilterOption {
  title: string;
  icon?: any;
  id?: string;
  parentId?: string;
  parentTitle?: string;
}

export interface CategoryGroupOption {
  id: string;
  title: string;
  slug?: string;
  icon?: any;
  subCategories: FilterOption[];
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: FilterOption[];
  categoryGroups?: CategoryGroupOption[];
  initialSelected: string[];
  onApply: (selected: string[]) => void;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  title,
  options,
  categoryGroups,
  initialSelected,
  onApply,
}) => {
  const theme = useTheme() as any;
  const [tempOptions, setTempOptions] = useState<string[]>(initialSelected);
  const [searchText, setSearchText] = useState("");
  const isCategoryFilter = title.toLowerCase().includes("categor") && Boolean(categoryGroups && categoryGroups.length > 0);

  // Active category tab for category hierarchy view
  const [selectedParentTab, setSelectedParentTab] = useState<string>("All");

  // Sync internal state when opened — intentional visible→state sync.
  useEffect(() => {
    if (visible) {
      setTempOptions(initialSelected);
      setSearchText("");

      // Automatically select tab based on existing selection if applicable
      if (categoryGroups && categoryGroups.length > 0) {
        if (initialSelected.length > 0) {
          const firstSel = initialSelected[0];
          // Check if it's a parent category
          const matchingParent = categoryGroups.find((g) => g.title === firstSel);
          if (matchingParent) {
            setSelectedParentTab(matchingParent.title);
          } else {
            // Check if it's a subcategory of one of the parents
            const parentOfSub = categoryGroups.find((g) =>
              g.subCategories.some((s) => s.title === firstSel)
            );
            if (parentOfSub) {
              setSelectedParentTab(parentOfSub.title);
            } else {
              setSelectedParentTab(categoryGroups[0].title);
            }
          }
        } else {
          setSelectedParentTab(categoryGroups[0]?.title || "All");
        }
      }
    }
  }, [visible, initialSelected, categoryGroups]);

  // Flat list for search across both categories and subcategories
  const allSearchableOptions = useMemo(() => {
    if (!isCategoryFilter || !categoryGroups) return options;
    const flat: (FilterOption & { isParent?: boolean })[] = [];
    for (const group of categoryGroups) {
      flat.push({
        id: group.id,
        title: group.title,
        icon: group.icon,
        isParent: true,
      });
      for (const sub of group.subCategories) {
        flat.push({
          id: sub.id,
          title: sub.title,
          icon: sub.icon,
          parentId: group.id,
          parentTitle: group.title,
          isParent: false,
        });
      }
    }
    return flat;
  }, [isCategoryFilter, categoryGroups, options]);

  // Search filtering
  const searchResults = useMemo(() => {
    if (!searchText.trim()) return [];
    const q = searchText.toLowerCase();
    return allSearchableOptions.filter((o) =>
      o.title.toLowerCase().includes(q) || (o.parentTitle && o.parentTitle.toLowerCase().includes(q))
    );
  }, [allSearchableOptions, searchText]);

  const handleToggleOption = (optionTitle: string) => {
    setTempOptions((prev) =>
      prev.includes(optionTitle)
        ? prev.filter((o) => o !== optionTitle)
        : [...prev, optionTitle],
    );
  };

  const handleClearAll = () => {
    setTempOptions([]);
    setSearchText("");
  };

  const handleApply = () => {
    onApply(tempOptions);
    onClose();
  };

  const currentGroup = useMemo(() => {
    if (!categoryGroups) return null;
    return categoryGroups.find((g) => g.title === selectedParentTab) || null;
  }, [categoryGroups, selectedParentTab]);

  const pillBase = "flex cursor-pointer flex-row items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2.5 text-[13px] font-semibold";

  const footer = (
    <div className="flex flex-row gap-3">
      <button
        type="button"
        onClick={handleClearAll}
        className="flex-1 cursor-pointer rounded-[14px] border py-4 text-base font-bold"
        style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
      >
        Clear All
      </button>
      <button
        type="button"
        onClick={handleApply}
        className="flex-[2] cursor-pointer rounded-[14px] py-4 text-base font-bold text-white shadow-lg"
        style={{ backgroundColor: theme.primary }}
      >
        Apply{tempOptions.length > 0 ? ` (${tempOptions.length})` : ""}
      </button>
    </div>
  );

  return (
    <AppSheet visible={visible} onClose={onClose} title={title} footer={footer} label={title}>
        {/* Search bar */}
        <div className="mx-6 mb-1">
          <div
            className="flex flex-row items-center gap-2 rounded-full border px-3.5 py-2"
            style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
          >
            <Search size={16} color={theme.tertiaryText} />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={isCategoryFilter ? "Search category or subcategory..." : `Search ${title.toLowerCase()}...`}
              autoCapitalize="none"
              className="w-full bg-transparent text-sm font-medium outline-none"
              style={{ color: theme.text }}
            />
            {searchText.length > 0 ? (
              <button type="button" onClick={() => setSearchText("")} aria-label="Clear search" className="cursor-pointer">
                <CircleX size={17} color={theme.tertiaryText} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Active selection pills summary strip */}
        {tempOptions.length > 0 && (
          <div className="mx-6 my-1">
            <div className="flex flex-row items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <span className="mr-0.5 text-[11px] font-semibold" style={{ color: theme.tertiaryText }}>
                Selected:
              </span>
              {tempOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleToggleOption(item)}
                  className="flex cursor-pointer flex-row items-center gap-1 rounded-xl border px-2.5 py-1"
                  style={{ backgroundColor: theme.primary + "22", borderColor: theme.primary }}
                >
                  <span className="text-[11px] font-semibold" style={{ color: theme.primary }}>
                    {item}
                  </span>
                  <X size={12} color={theme.primary} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="pb-2">
          {/* Case 1: Searching */}
          {searchText.trim().length > 0 ? (
            searchResults.length === 0 ? (
              <div className="flex flex-col items-center p-8">
                <Search size={36} color={theme.tertiaryText} />
                <p className="mt-2.5 text-sm" style={{ color: theme.secondaryText }}>
                  No results for {'"'}{searchText}{'"'}
                </p>
              </div>
            ) : (
              <div className="flex flex-row flex-wrap gap-3 px-6 py-2">
                {searchResults.map((option) => {
                  const isSelected = tempOptions.includes(option.title);
                  return (
                    <button
                      key={`${option.parentId || "root"}-${option.title}`}
                      type="button"
                      onClick={() => handleToggleOption(option.title)}
                      className={cn(pillBase, "rounded-full")}
                      style={{
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected ? theme.primary : (theme.secondaryBackground ?? theme.background),
                        color: isSelected ? "#fff" : theme.text,
                      }}
                    >
                      {option.icon && (
                        <AppIcon icon={option.icon} size={16} color={isSelected ? "#fff" : theme.text} />
                      )}
                      <span className="flex flex-col text-left">
                        <span className="text-[13px] font-semibold">{option.title}</span>
                        {option.parentTitle && (
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: isSelected ? "rgba(255,255,255,0.8)" : theme.tertiaryText }}
                          >
                            in {option.parentTitle}
                          </span>
                        )}
                      </span>
                      {isSelected && <Check size={14} color="#fff" className="ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            )
          ) : isCategoryFilter && categoryGroups ? (
            /* Case 2: Hierarchical Category + Subcategory view */
            <div className="pt-1">
              {/* Step 1: Category Selector Tabs */}
              <div className="mb-3">
                <div className="mb-1.5 px-6">
                  <p className="text-[13px] font-bold tracking-wide uppercase" style={{ color: theme.secondaryText }}>
                    Select Category
                  </p>
                </div>
                <div className="flex flex-row gap-2 overflow-x-auto px-6" style={{ scrollbarWidth: "none" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedParentTab("All")}
                    className="cursor-pointer rounded-[20px] border-[1.5px] px-4 py-2 text-[13px]"
                    style={{
                      borderColor: selectedParentTab === "All" ? theme.primary : theme.border,
                      backgroundColor: selectedParentTab === "All" ? theme.primary : theme.secondaryBackground,
                      color: selectedParentTab === "All" ? "#fff" : theme.text,
                      fontWeight: selectedParentTab === "All" ? 700 : 600,
                    }}
                  >
                    All Categories
                  </button>

                  {categoryGroups.map((group) => {
                    const isActiveTab = selectedParentTab === group.title;
                    const hasSelection =
                      tempOptions.includes(group.title) ||
                      group.subCategories.some((s) => tempOptions.includes(s.title));

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedParentTab(group.title)}
                        className="flex cursor-pointer flex-row items-center gap-1.5 rounded-[20px] border-[1.5px] px-3.5 py-2 text-[13px]"
                        style={{
                          borderColor: isActiveTab ? theme.primary : hasSelection ? theme.primary + "88" : theme.border,
                          backgroundColor: isActiveTab ? theme.primary : hasSelection ? theme.primary + "15" : theme.secondaryBackground,
                          color: isActiveTab ? "#fff" : theme.text,
                          fontWeight: isActiveTab ? 700 : 600,
                        }}
                      >
                        {group.icon && (
                          <AppIcon icon={group.icon} size={15} color={isActiveTab ? "#fff" : theme.text} />
                        )}
                        {group.title}
                        {group.subCategories.length > 0 && (
                          <span
                            className="rounded-[10px] px-1.5 py-px text-[10px] font-bold"
                            style={{ backgroundColor: isActiveTab ? "rgba(255,255,255,0.25)" : theme.border, color: isActiveTab ? "#fff" : theme.secondaryText }}
                          >
                            {group.subCategories.length}
                          </span>
                        )}
                        {hasSelection && !isActiveTab && (
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Subcategory Content View */}
              {selectedParentTab !== "All" && currentGroup ? (
                <div className="mt-1 px-6">
                  {/* Subcategory Header */}
                  <div
                    className="mb-2 flex flex-row items-center justify-between border-b py-2"
                    style={{ borderBottomColor: theme.border }}
                  >
                    <div>
                      <p className="text-[15px] font-bold" style={{ color: theme.text }}>
                        {currentGroup.title}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: theme.tertiaryText }}>
                        {currentGroup.subCategories.length > 0
                          ? "Tap a subcategory to filter, or select All to see everything"
                          : "No subcategories — filter by entire category"}
                      </p>
                    </div>
                  </div>

                  {/* Subcategory Pills Grid */}
                  <div className="flex flex-row flex-wrap gap-3 pt-1">
                    {/* Category-wide option: "All in [Category]" */}
                    <button
                      type="button"
                      onClick={() => handleToggleOption(currentGroup.title)}
                      className={cn(pillBase, "rounded-full px-4 py-2.5")}
                      style={{
                        borderColor: tempOptions.includes(currentGroup.title) ? theme.primary : theme.border,
                        backgroundColor: tempOptions.includes(currentGroup.title) ? theme.primary : theme.secondaryBackground,
                        color: tempOptions.includes(currentGroup.title) ? "#fff" : theme.text,
                        fontWeight: 700,
                      }}
                    >
                      <Layers size={15} color={tempOptions.includes(currentGroup.title) ? "#fff" : theme.text} />
                      All in {currentGroup.title}
                      {tempOptions.includes(currentGroup.title) && <Check size={14} color="#fff" />}
                    </button>

                    {/* Individual Subcategories */}
                    {currentGroup.subCategories.map((sub) => {
                      const isSelected = tempOptions.includes(sub.title);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleToggleOption(sub.title)}
                          className={cn(pillBase, "rounded-full px-4 py-2.5")}
                          style={{
                            borderColor: isSelected ? theme.primary : theme.border,
                            backgroundColor: isSelected ? theme.primary : theme.secondaryBackground,
                            color: isSelected ? "#fff" : theme.text,
                          }}
                        >
                          {sub.icon && (
                            <AppIcon icon={sub.icon} size={15} color={isSelected ? "#fff" : theme.text} />
                          )}
                          {sub.title}
                          {isSelected && <Check size={14} color="#fff" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* "All Categories" Tab View — Grouped Cards */
                <div className="mt-1 flex flex-col gap-4 px-6">
                  {categoryGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-2xl border p-3"
                      style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
                    >
                      <div className="mb-2.5 flex flex-row items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedParentTab(group.title)}
                          className="flex cursor-pointer flex-row items-center gap-1.5"
                        >
                          {group.icon && (
                            <AppIcon icon={group.icon} size={17} color={theme.primary} />
                          )}
                          <span className="text-sm font-bold" style={{ color: theme.text }}>
                            {group.title}
                          </span>
                          <ChevronRight size={14} color={theme.tertiaryText} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleOption(group.title)}
                          className="cursor-pointer rounded-lg border px-2 py-1 text-[11px] font-semibold"
                          style={{
                            borderColor: tempOptions.includes(group.title) ? theme.primary : theme.border,
                            backgroundColor: tempOptions.includes(group.title) ? theme.primary : "transparent",
                            color: tempOptions.includes(group.title) ? "#fff" : theme.secondaryText,
                          }}
                        >
                          {tempOptions.includes(group.title) ? "Selected" : "Select All"}
                        </button>
                      </div>

                      <div className="flex flex-row flex-wrap gap-1.5">
                        {group.subCategories.length > 0 ? (
                          group.subCategories.map((sub) => {
                            const isSelected = tempOptions.includes(sub.title);
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleToggleOption(sub.title)}
                                className="flex cursor-pointer flex-row items-center gap-1 rounded-[20px] border px-3 py-1.5 text-xs font-semibold"
                                style={{
                                  borderColor: isSelected ? theme.primary : theme.border,
                                  backgroundColor: isSelected ? theme.primary : theme.background,
                                  color: isSelected ? "#fff" : theme.text,
                                }}
                              >
                                {sub.title}
                                {isSelected && <Check size={12} color="#fff" />}
                              </button>
                            );
                          })
                        ) : (
                          <span className="text-xs italic" style={{ color: theme.tertiaryText }}>
                            No subcategories
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Case 3: Fallback / Simple List (Gender, etc.) */
            <div className="flex flex-row flex-wrap gap-3 px-6 py-2">
              {options.map((option) => {
                const isSelected = tempOptions.includes(option.title);
                return (
                  <button
                    key={option.title}
                    type="button"
                    onClick={() => handleToggleOption(option.title)}
                    className={cn(pillBase, "rounded-full px-4 py-2.5 text-sm")}
                    style={{
                      borderColor: isSelected ? theme.primary : theme.border,
                      backgroundColor: isSelected ? theme.primary : (theme.secondaryBackground ?? theme.background),
                      color: isSelected ? "#fff" : theme.text,
                    }}
                  >
                    {option.icon && (
                      <AppIcon icon={option.icon} size={16} color={isSelected ? "#fff" : theme.text} />
                    )}
                    {option.title}
                    {isSelected && <Check size={14} color="#fff" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
    </AppSheet>
  );
};
