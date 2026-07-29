import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, TextInput } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

const SEARCH_COLLAPSED = 38;

interface ExpandableSearchBarProps {
  onSearchSubmit?: (query: string) => void;
  placeholder?: string;
  searchRoute?: string;
}

export const ExpandableSearchBar: React.FC<ExpandableSearchBarProps> = ({
  onSearchSubmit,
  placeholder = "Search...",
  searchRoute = "/(tabs)/clothing/search",
}) => {
  const isWeb = Platform.OS === "web";
  const expandedWidth = isWeb ? 220 : 210;
  const theme = useTheme();
  const router = useRouter();
  const searchWidth = useSharedValue(SEARCH_COLLAPSED);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const isSearchOpenRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  const openSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    searchWidth.value = withTiming(expandedWidth, { duration: 300 });
    setIsSearchOpen(true);
    isSearchOpenRef.current = true;
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [searchWidth, expandedWidth]);

  const collapseSearch = useCallback(() => {
    searchWidth.value = withTiming(SEARCH_COLLAPSED, { duration: 300 });
    setIsSearchOpen(false);
    isSearchOpenRef.current = false;
    setSearchText("");
  }, [searchWidth]);

  const handleSearchSubmit = useCallback(() => {
    if (searchText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onSearchSubmit) {
        onSearchSubmit(searchText.trim());
      } else {
        router.push({
          pathname: searchRoute as any,
          params: { query: searchText.trim() },
        });
      }
      collapseSearch();
      Keyboard.dismiss();
    }
  }, [searchText, router, collapseSearch, onSearchSubmit, searchRoute]);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      if (isSearchOpenRef.current) {
        collapseSearch();
      }
    });
    return () => sub.remove();
  }, [collapseSearch]);

  const searchAnimStyle = useAnimatedStyle(() => ({
    width: searchWidth.value,
  }));

  const webPressableStyle = isWeb ? ({ cursor: "pointer" } as any) : {};

  return (
    <Animated.View
      style={[
        styles.searchBtn,
        { backgroundColor: theme.tertiaryBackground },
        searchAnimStyle,
      ]}
    >
      <Pressable
        onPress={isSearchOpen ? collapseSearch : openSearch}
        style={[styles.searchTouchable, webPressableStyle]}
      >
        <Ionicons name="search-outline" size={20} color={theme.text} />
      </Pressable>
      {isSearchOpen && (
        <TextInput
          ref={inputRef}
          style={[
            styles.expandedInput,
            { color: theme.text },
            isWeb && ({ outline: "none", backgroundColor: "transparent" } as any),
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.tertiaryText}
          returnKeyType="search"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearchSubmit}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  searchBtn: {
    height: 38,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  searchTouchable: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  expandedInput: {
    flex: 1,
    height: 38,
    paddingRight: 12,
    fontSize: 14,
  },
});
