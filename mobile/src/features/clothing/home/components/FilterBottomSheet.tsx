import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
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
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: FilterOption[];
  initialSelected: string[];
  onApply: (selected: string[]) => void;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  title,
  options,
  initialSelected,
  onApply,
}) => {
  const theme = useTheme() as any;
  const sheet = useSheet();
  const [tempOptions, setTempOptions] = useState<string[]>(initialSelected);

  // Sync internal state when opened
  useEffect(() => {
    if (visible) {
      setTempOptions(initialSelected);
    }
  }, [visible, initialSelected]);

  // Imperative present/dismiss from the parent `visible` prop.
  useEffect(() => {
    if (visible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
    // sheet.current is stable across renders
  }, [visible, sheet]);

  const handleToggleOption = (optionTitle: string) => {
    setTempOptions((prev) =>
      prev.includes(optionTitle)
        ? prev.filter((o) => o !== optionTitle)
        : [...prev, optionTitle],
    );
  };

  const handleClearAll = () => {
    setTempOptions([]);
  };

  const handleApply = () => {
    onApply(tempOptions);
    onClose();
  };

  return (
    <Sheet
      ref={sheet}
      onDidDismiss={onClose}
      backgroundColor={theme.background}
    >
      <SheetHeader title={title} onClose={onClose} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          }}
        >
          {(() => {
            const isCategories = title === "Categories";
            const rootOptions = isCategories
              ? options.filter((opt) => !opt.parentId)
              : options;
            const subOptions = isCategories
              ? options.filter((opt) => opt.parentId)
              : [];

            return rootOptions.map((option) => {
              const isSelected = tempOptions.includes(option.title);
              const matchingSubs = subOptions.filter(
                (sub) => sub.parentId === option.id,
              );

              if (isCategories) {
                return (
                  <View
                    key={option.title}
                    style={{ width: "100%", marginBottom: 12 }}
                  >
                    <TouchableOpacity
                      style={[
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 20,
                          paddingVertical: 12,
                          borderRadius: 100,
                          borderWidth: 1,
                          gap: 8,
                          width: "100%",
                          justifyContent: "space-between",
                        },
                        {
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.secondaryBackground ?? theme.background,
                        },
                      ]}
                      onPress={() => {
                        const subTitles = matchingSubs.map((s) => s.title);
                        setTempOptions((prev) => {
                          const filtered = prev.filter(
                            (o) => !subTitles.includes(o),
                          );
                          return filtered.includes(option.title)
                            ? filtered.filter((o) => o !== option.title)
                            : [...filtered, option.title];
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        {option.icon && (
                          <HugeiconsIcon
                            {...({
                              icon: option.icon,
                              size: 18,
                              color: isSelected ? "#fff" : theme.text,
                              style: { marginRight: 6 },
                            } as any)}
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
                      </View>
                      {matchingSubs.length > 0 && (
                        <Text
                          style={{
                            color: isSelected ? "#fff" : theme.secondaryText,
                            fontSize: 16,
                          }}
                        >
                          {isSelected ? "−" : "+"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Subcategories section */}
                    {matchingSubs.length > 0 && isSelected && (
                      <View
                        style={{
                          paddingLeft: 12,
                          marginTop: 8,
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {matchingSubs.map((sub) => {
                          const isSubSelected = tempOptions.includes(
                            sub.title,
                          );
                          return (
                            <TouchableOpacity
                              key={sub.title}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 100,
                                borderWidth: 1,
                                borderColor: isSubSelected
                                  ? theme.primary
                                  : theme.border,
                                backgroundColor: isSubSelected
                                  ? theme.primary
                                  : theme.secondaryBackground ??
                                    theme.background,
                              }}
                              onPress={() => {
                                setTempOptions((prev) => {
                                  const filtered = prev.filter(
                                    (o) => o !== option.title,
                                  );
                                  return filtered.includes(sub.title)
                                    ? filtered.filter(
                                        (o) => o !== sub.title,
                                      )
                                    : [...filtered, sub.title];
                                });
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: isSubSelected ? "#fff" : theme.text,
                                }}
                              >
                                {sub.title}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={option.title}
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 100,
                      borderWidth: 1,
                      gap: 8,
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
                    <HugeiconsIcon
                      {...({
                        icon: option.icon,
                        size: 18,
                        color: isSelected ? "#fff" : theme.text,
                        style: { marginRight: 6 },
                      } as any)}
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
                </TouchableOpacity>
              );
            });
          })()}
        </View>
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
              letterSpacing: 0.2,
            }}
          >
            Apply
          </Text>
        </TouchableOpacity>
      </SheetFooter>
    </Sheet>
  );
};
