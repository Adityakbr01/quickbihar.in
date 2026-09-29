import { CircleX, Search } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import React, { useRef, useState } from "react";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { TextInput } from "@/src/theme/components/TextInput";

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
}: SearchHeaderProps) => {
  const theme = useTheme();
  const inputRef = useRef<any>(null);

  // Focus ring (CSS transition replaces the reanimated spring)
  const [focused, setFocused] = useState(false);

  const handleFocus = () => {
    setFocused(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  const handleClear = () => {
    onClear();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    inputRef.current?.focus();
  };

  return (
    <div className="px-4 py-3" style={{ backgroundColor: theme.background }}>
      <div
        className="flex h-12 flex-row items-center rounded-xl px-3 transition-all duration-200"
        style={{
          backgroundColor: theme.tertiaryBackground,
          borderColor: theme.primary,
          borderWidth: focused ? 2 : 0,
          borderStyle: "solid",
          transform: `scale(${focused ? 1.01 : 1})`,
        }}
      >
        <TextInput
          ref={inputRef}
          bare
          value={query}
          onChangeText={setQuery}
          placeholder="Search products"
          placeholderTextColor={theme.tertiaryText}
          autoFocus={false}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          icon={
            <Search size={20} color={theme.secondaryText} />
          }
          rightIcon={
            query.length > 0 ? (
              <button type="button" onClick={handleClear} aria-label="Clear search" className="cursor-pointer p-1">
                <CircleX size={20} color={theme.tertiaryText} />
              </button>
            ) : undefined
          }
          containerStyle={{ marginBottom: 0, flex: 1 }}
          inputContainerStyle={{
            backgroundColor: "transparent",
            borderWidth: 0,
            paddingHorizontal: 0,
            paddingVertical: 0,
          }}
          style={{ fontSize: 16, color: theme.text }}
        />
      </div>
    </div>
  );
};

export default SearchHeader;
