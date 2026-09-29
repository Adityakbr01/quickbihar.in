import React, { useCallback, useRef, useState } from "react";

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
  const expandedWidth = 220;
  const theme = useTheme();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef<any>(null);

  const openSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  const collapseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchText("");
  }, []);

  const dismissKeyboard = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

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
      dismissKeyboard();
    }
  }, [searchText, navigate, collapseSearch, onSearchSubmit, searchRoute]);

  return (
    <div
      className="flex h-[38px] flex-row items-center overflow-hidden rounded-[19px] transition-all duration-300"
      style={{
        backgroundColor: theme.tertiaryBackground,
        width: isSearchOpen ? expandedWidth : SEARCH_COLLAPSED,
      }}
    >
      <button
        type="button"
        onClick={isSearchOpen ? collapseSearch : openSearch}
        aria-label={isSearchOpen ? "Close search" : "Open search"}
        className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center"
      >
        <Search size={20} color={theme.text} />
      </button>
      {isSearchOpen && (
        <TextInput
          ref={inputRef}
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
    </div>
  );
};
