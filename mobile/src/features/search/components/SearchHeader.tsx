import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useEffect } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

interface SearchHeaderProps {
  query: string;
  setQuery: (text: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  onBack?: () => void;
}

const SearchHeader = ({
  query,
  setQuery,
  onClear,
  onSubmit,
  onBack
}: SearchHeaderProps) => {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const isWeb = Platform.OS === "web";

  // Animations
  const focusAnim = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: theme.primary,
    borderWidth: withSpring(focusAnim.value * 2),
    transform: [{ scale: withSpring(1 + focusAnim.value * 0.01) }],
  }));

  const handleFocus = () => {
    focusAnim.value = 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBlur = () => {
    focusAnim.value = 0;
  };

  const handleClear = () => {
    onClear();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.header, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.tertiaryBackground },
          containerStyle,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.secondaryText}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search products"
          placeholderTextColor={theme.tertiaryText}
          style={[styles.input, { color: theme.text }]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color={theme.tertiaryText} />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
    }),
  },
  clearBtn: {
    padding: 4,
  },
});

export default SearchHeader;
