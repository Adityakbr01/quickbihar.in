import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [searchText, setSearchText] = useState("");

  // Sync internal state when opened
  useEffect(() => {
    if (visible) {
      setTempOptions(initialSelected);
      setSearchText("");
    }
  }, [visible, initialSelected]);

  // Imperative present/dismiss from the parent `visible` prop.
  useEffect(() => {
    if (visible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [visible, sheet]);

  // Show search bar only when there are enough options to warrant it
  const showSearch = options.length > 6;

  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return options;
    const q = searchText.toLowerCase();
    return options.filter((o) => o.title.toLowerCase().includes(q));
  }, [options, searchText]);

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

  const selectedCount = tempOptions.length;

  return (
    <Sheet
      ref={sheet}
      onDidDismiss={onClose}
      backgroundColor={theme.background}
    >
      <SheetHeader title={title} onClose={onClose} />

      {/* Optional search bar */}
      {showSearch && (
        <View
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.sm,
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
            placeholder={`Search ${title.toLowerCase()}...`}
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
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {filteredOptions.length === 0 ? (
          <View style={{ padding: spacing.xl, alignItems: "center" }}>
            <Ionicons name="search-outline" size={36} color={theme.tertiaryText} />
            <Text style={{ color: theme.secondaryText, marginTop: 10, fontSize: 14 }}>
              No results for "{searchText}"
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
            {filteredOptions.map((option) => {
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
                    <HugeiconsIcon
                      {...({
                        icon: option.icon,
                        size: 16,
                        color: isSelected ? "#fff" : theme.text,
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
              letterSpacing: 0.2,
            }}
          >
            {selectedCount > 0 ? `Apply (${selectedCount})` : "Apply"}
          </Text>
        </TouchableOpacity>
      </SheetFooter>
    </Sheet>
  );
};
