import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

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
  const animation = useSharedValue(0);
  const hasSubItems = subItems.length > 0;

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newValue = expanded ? 0 : 1;
    animation.value = withTiming(newValue, { duration: 300 });
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

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(animation.value, [0, 1], [0, subItems.length * 56]), // Approx 56px per row
      opacity: animation.value,
    };
  });

  const chevronAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${animation.value * 90}deg` }],
    };
  });

  return (
    <View>
      <TouchableOpacity
        style={styles.optionRow}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <HugeiconsIcon
            icon={icon}
            size={22}
            color={danger ? "#FF3B30" : theme.primary}
            strokeWidth={1.5}
          />
        </View>

        <Text style={[styles.optionLabel, danger && styles.logoutText]}>
          {label}
        </Text>

        {showArrow && (
          <Animated.View style={chevronAnimatedStyle}>
            <HugeiconsIcon
              icon={hasSubItems ? ArrowRight01Icon : ArrowRight01Icon}
              size={20}
              color={theme.tertiaryText}
              style={styles.chevron}
            />
          </Animated.View>
        )}
      </TouchableOpacity>

      {hasSubItems && (
        <Animated.View style={[styles.subItemsContainer, contentAnimatedStyle]}>
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
                <HugeiconsIcon
                  icon={item.icon}
                  size={18}
                  color={theme.primary}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={styles.subOptionLabel}>{item.label}</Text>
              {index !== subItems.length - 1 && <View style={styles.subDivider} />}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {!isLast && !expanded && <View style={styles.divider} />}
    </View>
  );
};

export default AccountOption;
