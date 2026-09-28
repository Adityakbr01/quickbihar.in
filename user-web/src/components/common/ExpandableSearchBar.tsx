import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, TextInput as RNTextInput, View } from "react-native";

import { Search } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { TextInput } from "@/src/theme/components/TextInput";

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
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const isSearchOpenRef = useRef(false);
  const inputRef = useRef<RNTextInput>(null);

  const openSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchOpen(true);
    isSearchOpenRef.current = true;
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [expandedWidth]);

  const collapseSearch = useCallback(() => {
    setIsSearchOpen(false);
    isSearchOpenRef.current = false;
    setSearchText("");
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onSearchSubmit) {
        onSearchSubmit(searchText.trim());
      } else {
        goTo(navigate, {
          pathname: searchRoute as any,
          params: { query: searchText.trim() },
        });
      }
      collapseSearch();
      Keyboard.dismiss();
    }
  }, [searchText, navigate, collapseSearch, onSearchSubmit, searchRoute]);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      if (isSearchOpenRef.current) {
        collapseSearch();
      }
    });
    return () => sub.remove();
  }, [collapseSearch]);

  const searchAnimStyle = {
    width: isSearchOpen ? expandedWidth : SEARCH_COLLAPSED,
    transition: "width 0.3s ease-out",
  };

  const webPressableStyle = isWeb ? ({ cursor: "pointer" } as any) : {};

  return (
    <View
      style={[
        styles.searchBtn,
        { backgroundColor: theme.tertiaryBackground },
        searchAnimStyle,
      ]}
    >
      <Pressable onPress={isSearchOpen ? collapseSearch : openSearch}
        style={[styles.searchTouchable, webPressableStyle]}
      >
        <Search size={20} color={theme.text} />
      </Pressable>
      {isSearchOpen && (
        <TextInput ref={inputRef}
          bare
          placeholder={placeholder}
          placeholderTextColor={theme.tertiaryText}
          returnKeyType="search"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearchSubmit}
          containerStyle={{ marginBottom: 0, flex: 1 }}
          inputContainerStyle={{
            backgroundColor: "transparent",
            borderWidth: 0,
            paddingHorizontal: 0,
            paddingVertical: 0,
            height: 38,
          }}
          style={{ fontSize: 14, color: theme.text }}
        />
      )}
    </View>
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
});
