import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import { useJewelerySearch } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

const popularSearches = [
  "Gold pendant",
  "Jhumka earrings",
  "Bridal necklace",
  "Diamond ring",
  "Meenakari bangle",
  "Everyday wear",
];

export default function JewelerySearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const topPad = Platform.OS === "web" ? 16 : insets.top;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data: pages, isLoading } = useJewelerySearch(debounced);
  const filtered = useMemo(
    () => (pages?.pages ?? []).flatMap((pg) => pg.data),
    [pages]
  );
  const total = pages?.pages?.[0]?.total ?? filtered.length;
  const hasQuery = query.trim() !== "";

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.ivory,
            borderBottomColor: colors.midGray,
          },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.pearl, borderColor: colors.midGray },
          ]}
        >
          <Feather name="search" size={16} color={colors.warmGray} />
          <TextInput
            style={[
              styles.input,
              { color: colors.ink, fontFamily: "DMSans_400Regular" },
            ]}
            placeholder="Search for jewellery..."
            placeholderTextColor={colors.warmGray}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.warmGray} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text
            style={[
              styles.cancelText,
              { color: colors.gold, fontFamily: "DMSans_400Regular" },
            ]}
          >
            Cancel
          </Text>
        </Pressable>
      </View>

      {query.trim() === "" ? (
        <View style={styles.suggestions}>
          <Text
            style={[
              styles.sugLabel,
              { color: colors.gold, fontFamily: "DMSans_500Medium" },
            ]}
          >
            POPULAR SEARCHES
          </Text>
          <View style={styles.chips}>
            {popularSearches.map((s) => (
              <Pressable
                key={s}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    borderColor: colors.midGray,
                    backgroundColor: pressed ? colors.pearl : "transparent",
                  },
                ]}
                onPress={() => setQuery(s)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: colors.ink,
                      fontFamily: "CormorantGaramond_400Regular_Italic",
                    },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.gold} />
          <Text
            style={[
              styles.emptyBody,
              { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
            ]}
          >
            Searching the vault...
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="search" size={32} color={colors.midGray} />
          <Text
            style={[
              styles.emptyText,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_500Medium_Italic",
              },
            ]}
          >
            No results for "{query}"
          </Text>
          <Text
            style={[
              styles.emptyBody,
              { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
            ]}
          >
            Try a different search term
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[Platform.OS === "web" && { paddingBottom: 34 }]}
        >
          <View style={styles.results}>
            <Text
              style={[
                styles.resultCount,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              {total} piece{total !== 1 ? "s" : ""} found
            </Text>
            <View style={styles.productGrid}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderRadius: 2,
  },
  input: { flex: 1, fontSize: 14 },
  cancelText: { fontSize: 13 },
  suggestions: { padding: 20, gap: 14 },
  sugLabel: { fontSize: 9, letterSpacing: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderRadius: 20,
  },
  chipText: { fontSize: 14 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
  emptyText: { fontSize: 22, textAlign: "center" },
  emptyBody: { fontSize: 14, textAlign: "center" },
  results: { padding: 16, gap: 12 },
  resultCount: { fontSize: 12 },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
});
