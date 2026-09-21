import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
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
        <TextInput
          ref={inputRef}
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
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.secondaryText}
            />
          }
          rightIcon={
            query.length > 0 ? (
              <Pressable onPress={handleClear} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color={theme.tertiaryText} />
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
  clearBtn: {
    padding: 4,
  },
});

export default SearchHeader;
