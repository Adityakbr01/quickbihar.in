import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { homeStyles as styles } from "../style/homeStyles";
import AnimatedBurger from "./AnimatedBurger";

const bellLottie = require("@/assets/lottie/Notification Bell.json");

const SEARCH_COLLAPSED = 38;

interface HomeHeaderProps {
  menuOpen: SharedValue<number>;
  toggleMenu: () => void;
}

const HomeHeader = ({ menuOpen, toggleMenu }: HomeHeaderProps) => {
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
    setSearchText(""); // Clear search on collapse
  }, [searchWidth]);

  const handleSearchSubmit = useCallback(() => {
    if (searchText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/search",
        params: { query: searchText.trim() }
      });
      collapseSearch();
      Keyboard.dismiss();
    }
  }, [searchText, router, collapseSearch]);

  const handleBurgerPress = useCallback(() => {
    Haptics.selectionAsync();
    toggleMenu();
  }, [toggleMenu]);

  // Collapse when keyboard hides (user tapped outside)
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      if (isSearchOpenRef.current) {
        collapseSearch();
      }
    });
    return () => sub.remove();
  }, [collapseSearch]);

  const handleOutsidePress = useCallback(() => {
    if (isSearchOpenRef.current) {
      Keyboard.dismiss();
      collapseSearch();
    }
  }, [collapseSearch]);

  const searchAnimStyle = useAnimatedStyle(() => ({
    width: searchWidth.value,
  }));

  const webPressableStyle = isWeb ? ({ cursor: "pointer" } as any) : {};

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <AnimatedBurger
          isOpen={menuOpen}
          onPress={handleBurgerPress}
          color={theme.text}
          size={20}
        />
      </View>

      <View style={styles.headerRight}>
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
                isWeb && ({ outline: "none", backgroundColor: "transparent" } as any)
              ]}
              placeholder="Search..."
              placeholderTextColor={theme.tertiaryText}
              returnKeyType="search"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
            />
          )}
        </Animated.View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleOutsidePress();
          }}
          style={[
            styles.notifBtn,
            { backgroundColor: theme.tertiaryBackground },
            webPressableStyle,
          ]}
        >
          <LottieView
            key={theme.text}
            source={bellLottie}
            autoPlay
            loop
            resizeMode="cover"
            renderMode="SOFTWARE"
            style={[
              localStyles.bellLottie,
              Platform.OS === 'web' && { filter: theme.text === '#ffffff' ? 'invert(1)' : 'none' } as any
            ]}
            colorFilters={
              theme.text === "#ffffff"
                ? [{ keypath: "**", color: "#ffffff" }]
                : []
            }
          />
          <View
            style={[
              styles.notifDot,
              { borderColor: theme.secondaryBackground, backgroundColor: '#FF3830' },
            ]}
          />
        </Pressable>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  bellLottie: {
    width: 48,
    height: 48,
  },
});

export default HomeHeader;
