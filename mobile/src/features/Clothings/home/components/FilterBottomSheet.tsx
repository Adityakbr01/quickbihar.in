import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createFilterBottomSheetStyles } from "../style/FilterBottomSheet.style";
import { HugeiconsIcon } from "@hugeicons/react-native";

export interface FilterOption {
  title: string;
  icon?: any;
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
  const styles = React.useMemo(
    () => createFilterBottomSheetStyles(theme),
    [theme],
  );

  const [tempOptions, setTempOptions] = useState<string[]>(initialSelected);

  // Sync internal state when opened
  useEffect(() => {
    if (visible) {
      setTempOptions(initialSelected);
    }
  }, [visible, initialSelected]);

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        {/* Do not close when tapping inside the sheet content */}
        <Pressable style={styles.bottomSheet}>
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetHandle} />
          </View>

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.pillsContainer}>
              {options.map((option) => {
                const isSelected = tempOptions.includes(option.title);
                return (
                  <TouchableOpacity
                    key={option.title}
                    style={[
                      styles.pillButton,
                      isSelected && styles.pillButtonActive,
                    ]}
                    onPress={() => handleToggleOption(option.title)}
                    activeOpacity={0.7}
                  >
                    {option.icon && (
                      <HugeiconsIcon
                        icon={option.icon}
                        size={18}
                        color={isSelected ? "#fff" : theme.text}
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.pillText,
                        isSelected && styles.pillTextActive,
                      ]}
                    >
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

