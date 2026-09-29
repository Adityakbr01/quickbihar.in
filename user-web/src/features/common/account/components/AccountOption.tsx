import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { AppIcon } from "@/src/components/common/AppIcon";
import { ChevronRight } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "@/components/primitives";


interface SubItem {
  label: string;
  icon: any;
  onPress: () => void;
}

interface AccountOptionProps {
  theme: Theme;
  styles: any;
  icon: any;
  label: string;
  onPress?: () => void;
  showArrow?: boolean;
  isLast?: boolean;
  danger?: boolean;
  subItems?: SubItem[];
}

const AccountOption = ({
  theme,
  styles,
  icon,
  label,
  onPress,
  showArrow = true,
  isLast = false,
  danger = false,
  subItems = [],
}: AccountOptionProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubItems = subItems.length > 0;

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpanded(!expanded);
  };

  const handlePress = () => {
    if (hasSubItems) {
      toggleExpand();
    } else if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const contentAnimatedStyle = {
    height: expanded ? subItems.length * 56 : 0, // Approx 56px per row
    opacity: expanded ? 1 : 0,
    overflow: "hidden" as const,
    transition: "height 0.3s ease-out, opacity 0.3s ease-out",
  };

  const chevronAnimatedStyle = {
    transform: [{ rotate: expanded ? "90deg" : "0deg" }],
    transition: "transform 0.3s ease-out",
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.optionRow}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <AppIcon
            icon={icon}
            size={22}
            color={danger ? "#FF3B30" : theme.primary}
          />
        </View>

        <Text style={[styles.optionLabel, danger && styles.logoutText]}>
          {label}
        </Text>

        {showArrow && (
          <View style={chevronAnimatedStyle}>
            <AppIcon
              icon={ChevronRight}
              size={20}
              color={theme.tertiaryText}
              style={styles.chevron}
            />
          </View>
        )}
      </TouchableOpacity>

      {hasSubItems && (
        <View style={[styles.subItemsContainer, contentAnimatedStyle]}>
          {subItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={styles.subOptionRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                item.onPress();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.subIconContainer}>
                <AppIcon
                  icon={item.icon}
                  size={18}
                  color={theme.primary}
                />
              </View>
              <Text style={styles.subOptionLabel}>{item.label}</Text>
              {index !== subItems.length - 1 && <View style={styles.subDivider} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isLast && !expanded && <View style={styles.divider} />}
    </View>
  );
};

export default AccountOption;
