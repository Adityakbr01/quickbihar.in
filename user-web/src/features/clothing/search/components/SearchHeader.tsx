import { CircleX, Search } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import React, { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "@/components/primitives";

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
  onBack
}: SearchHeaderProps) => {
  const theme = useTheme();
  const inputRef = useRef<RNTextInput>(null);

  // Focus ring (CSS transition replaces the reanimated spring)
  const [focused, setFocused] = useState(false);

  const containerStyle = {
    borderColor: theme.primary,
    borderWidth: focused ? 2 : 0,
    transform: [{ scale: focused ? 1.01 : 1 }],
    transition: "border-width 0.2s ease-out, transform 0.2s ease-out",
  };

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
    <View style={[styles.header, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.tertiaryBackground },
          containerStyle,
        ]}
      >
        <TextInput ref={inputRef}
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
              <Pressable onPress={handleClear} style={styles.clearBtn}>
                <CircleX size={20} color={theme.tertiaryText} />
              </Pressable>
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
      </View>
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
  clearBtn: {
    padding: 4,
  },
});

export default SearchHeader;
