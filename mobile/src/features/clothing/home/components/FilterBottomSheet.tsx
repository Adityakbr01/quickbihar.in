import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  Sheet,
  SheetFooter,
  SheetHeader,
  useSheet,
} from "@/src/components/common/BottomSheet";
import { spacing } from "@/src/theme/spacing";

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
  const sheet = useSheet();
  const [tempOptions, setTempOptions] = useState<string[]>(initialSelected);
  const [searchText, setSearchText] = useState("");
  const isCategoryFilter = title.toLowerCase().includes("categor") && Boolean(categoryGroups && categoryGroups.length > 0);

  // Active category tab for category hierarchy view
  const [selectedParentTab, setSelectedParentTab] = useState<string>("All");

  // Sync internal state when opened — intentional visible→state sync.
  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Imperative present/dismiss from the parent `visible` prop.
  useEffect(() => {
    if (visible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [visible, sheet]);

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

  return (
    <Sheet
      ref={sheet}
      onDidDismiss={onClose}
      backgroundColor={theme.background}
    >
      <SheetHeader title={title} onClose={onClose} />

      {/* Search bar */}
      <View
        style={{
          marginHorizontal: spacing.lg,
          marginBottom: spacing.xs,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.secondaryBackground,
          borderRadius: 50,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderWidth: 1,
          borderColor: searchText ? theme.primary : theme.border,
        }}
      >
        <Ionicons name="search" size={16} color={theme.tertiaryText} style={{ marginRight: 8 }} />
        <TextInput
          placeholder={isCategoryFilter ? "Search category or subcategory..." : `Search ${title.toLowerCase()}...`}
          placeholderTextColor={theme.tertiaryText}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          style={{
            flex: 1,
            color: theme.text,
            fontSize: 14,
            fontWeight: "500",
          }}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={17} color={theme.tertiaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Active selection pills summary strip */}
      {tempOptions.length > 0 && (
        <View style={{ marginHorizontal: spacing.lg, marginVertical: spacing.xs }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: theme.tertiaryText, marginRight: 2 }}>
              Selected:
            </Text>
            {tempOptions.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => handleToggleOption(item)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: theme.primary + "22",
                  borderColor: theme.primary,
                  borderWidth: 1,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: 12,
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "600", color: theme.primary }}>
                  {item}
                </Text>
                <Ionicons name="close" size={12} color={theme.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Case 1: Searching */}
        {searchText.trim().length > 0 ? (
          searchResults.length === 0 ? (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <Ionicons name="search-outline" size={36} color={theme.tertiaryText} />
              <Text style={{ color: theme.secondaryText, marginTop: 10, fontSize: 14 }}>
                No results for {'"'}{searchText}{'"'}
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              }}
            >
              {searchResults.map((option) => {
                const isSelected = tempOptions.includes(option.title);
                return (
                  <TouchableOpacity
                    key={`${option.parentId || "root"}-${option.title}`}
                    style={[
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 100,
                        borderWidth: 1.5,
                        gap: 6,
                      },
                      {
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.secondaryBackground ?? theme.background,
                      },
                    ]}
                    onPress={() => handleToggleOption(option.title)}
                    activeOpacity={0.7}
                  >
                    {option.icon && (
                      <AppIcon
                        name={option.icon}
                        size={16}
                        color={isSelected ? "#fff" : theme.text}
                      />
                    )}
                    <View style={{ flexDirection: "column" }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: isSelected ? "#fff" : theme.text,
                        }}
                      >
                        {option.title}
                      </Text>
                      {option.parentTitle && (
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "500",
                            color: isSelected ? "rgba(255,255,255,0.8)" : theme.tertiaryText,
                          }}
                        >
                          in {option.parentTitle}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#fff" style={{ marginLeft: 2 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        ) : isCategoryFilter && categoryGroups ? (
          /* Case 2: Hierarchical Category + Subcategory view */
          <View style={{ paddingTop: spacing.xs }}>
            {/* Step 1: Category Selector Tabs */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ paddingHorizontal: spacing.lg, marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.secondaryText, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Select Category
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedParentTab("All")}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: selectedParentTab === "All" ? theme.primary : theme.border,
                    backgroundColor: selectedParentTab === "All" ? theme.primary : theme.secondaryBackground,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: selectedParentTab === "All" ? "700" : "600",
                      color: selectedParentTab === "All" ? "#fff" : theme.text,
                    }}
                  >
                    All Categories
                  </Text>
                </TouchableOpacity>

                {categoryGroups.map((group) => {
                  const isActiveTab = selectedParentTab === group.title;
                  const hasSelection =
                    tempOptions.includes(group.title) ||
                    group.subCategories.some((s) => tempOptions.includes(s.title));

                  return (
                    <TouchableOpacity
                      key={group.id}
                      onPress={() => setSelectedParentTab(group.title)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: isActiveTab ? theme.primary : hasSelection ? theme.primary + "88" : theme.border,
                        backgroundColor: isActiveTab
                          ? theme.primary
                          : hasSelection
                            ? theme.primary + "15"
                            : theme.secondaryBackground,
                      }}
                    >
                      {group.icon && (
                        <AppIcon
                          name={group.icon}
                          size={15}
                          color={isActiveTab ? "#fff" : theme.text}
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isActiveTab ? "700" : "600",
                          color: isActiveTab ? "#fff" : theme.text,
                        }}
                      >
                        {group.title}
                      </Text>
                      {group.subCategories.length > 0 && (
                        <View
                          style={{
                            backgroundColor: isActiveTab ? "rgba(255,255,255,0.25)" : theme.border,
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: isActiveTab ? "#fff" : theme.secondaryText,
                            }}
                          >
                            {group.subCategories.length}
                          </Text>
                        </View>
                      )}
                      {hasSelection && !isActiveTab && (
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: theme.primary,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Step 2: Subcategory Content View */}
            {selectedParentTab !== "All" && currentGroup ? (
              <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xs }}>
                {/* Subcategory Header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    marginBottom: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>
                      {currentGroup.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.tertiaryText, marginTop: 2 }}>
                      {currentGroup.subCategories.length > 0
                        ? "Tap a subcategory to filter, or select All to see everything"
                        : "No subcategories — filter by entire category"}
                    </Text>
                  </View>
                </View>

                {/* Subcategory Pills Grid */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingTop: 4 }}>
                  {/* Category-wide option: "All in [Category]" */}
                  <TouchableOpacity
                    onPress={() => handleToggleOption(currentGroup.title)}
                    activeOpacity={0.7}
                    style={[
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        borderRadius: 100,
                        borderWidth: 1.5,
                        gap: 6,
                      },
                      {
                        borderColor: tempOptions.includes(currentGroup.title) ? theme.primary : theme.border,
                        backgroundColor: tempOptions.includes(currentGroup.title)
                          ? theme.primary
                          : theme.secondaryBackground,
                      },
                    ]}
                  >
                    <Ionicons
                      name="layers-outline"
                      size={15}
                      color={tempOptions.includes(currentGroup.title) ? "#fff" : theme.text}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: tempOptions.includes(currentGroup.title) ? "#fff" : theme.text,
                      }}
                    >
                      All in {currentGroup.title}
                    </Text>
                    {tempOptions.includes(currentGroup.title) && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </TouchableOpacity>

                  {/* Individual Subcategories */}
                  {currentGroup.subCategories.map((sub) => {
                    const isSelected = tempOptions.includes(sub.title);
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        onPress={() => handleToggleOption(sub.title)}
                        activeOpacity={0.7}
                        style={[
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 15,
                            paddingVertical: 10,
                            borderRadius: 100,
                            borderWidth: 1.5,
                            gap: 6,
                          },
                          {
                            borderColor: isSelected ? theme.primary : theme.border,
                            backgroundColor: isSelected
                              ? theme.primary
                              : theme.secondaryBackground,
                          },
                        ]}
                      >
                        {sub.icon && (
                          <AppIcon
                            name={sub.icon}
                            size={15}
                            color={isSelected ? "#fff" : theme.text}
                          />
                        )}
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: isSelected ? "#fff" : theme.text,
                          }}
                        >
                          {sub.title}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* "All Categories" Tab View — Grouped Cards */
              <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.xs }}>
                {categoryGroups.map((group) => (
                  <View
                    key={group.id}
                    style={{
                      backgroundColor: theme.secondaryBackground,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: theme.border,
                      padding: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => setSelectedParentTab(group.title)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                      >
                        {group.icon && (
                          <AppIcon
                            name={group.icon}
                            size={17}
                            color={theme.primary}
                          />
                        )}
                        <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text }}>
                          {group.title}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.tertiaryText} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleToggleOption(group.title)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: tempOptions.includes(group.title) ? theme.primary : theme.border,
                          backgroundColor: tempOptions.includes(group.title) ? theme.primary : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: tempOptions.includes(group.title) ? "#fff" : theme.secondaryText,
                          }}
                        >
                          {tempOptions.includes(group.title) ? "Selected" : "Select All"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {group.subCategories.length > 0 ? (
                        group.subCategories.map((sub) => {
                          const isSelected = tempOptions.includes(sub.title);
                          return (
                            <TouchableOpacity
                              key={sub.id}
                              onPress={() => handleToggleOption(sub.title)}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                paddingHorizontal: 12,
                                paddingVertical: 7,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: isSelected ? theme.primary : theme.border,
                                backgroundColor: isSelected ? theme.primary : theme.background,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: isSelected ? "#fff" : theme.text,
                                }}
                              >
                                {sub.title}
                              </Text>
                              {isSelected && (
                                <Ionicons name="checkmark" size={12} color="#fff" />
                              )}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <Text style={{ fontSize: 12, color: theme.tertiaryText, fontStyle: "italic" }}>
                          No subcategories
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Case 3: Fallback / Simple List (Gender, etc.) */
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            }}
          >
            {options.map((option) => {
              const isSelected = tempOptions.includes(option.title);
              return (
                <TouchableOpacity
                  key={option.title}
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 11,
                      borderRadius: 100,
                      borderWidth: 1.5,
                      gap: 6,
                    },
                    {
                      borderColor: isSelected ? theme.primary : theme.border,
                      backgroundColor: isSelected
                        ? theme.primary
                        : theme.secondaryBackground ?? theme.background,
                    },
                  ]}
                  onPress={() => handleToggleOption(option.title)}
                  activeOpacity={0.7}
                >
                  {option.icon && (
                    <AppIcon
                      name={option.icon}
                      size={16}
                      color={isSelected ? "#fff" : theme.text}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isSelected ? "#fff" : theme.text,
                    }}
                  >
                    {option.title}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <SheetFooter>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: "center",
            backgroundColor: theme.background,
          }}
          onPress={handleClearAll}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: theme.text,
            }}
          >
            Clear All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 2,
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: theme.primary,
            alignItems: "center",
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,

          }}
          onPress={handleApply}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#fff",
            }}
          >
            Apply{tempOptions.length > 0 ? ` (${tempOptions.length})` : ""}
          </Text>
        </TouchableOpacity>
      </SheetFooter>
    </Sheet>
  );
};
