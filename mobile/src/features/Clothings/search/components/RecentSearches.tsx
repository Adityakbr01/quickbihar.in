import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

interface RecentSearchesProps {
  history: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
}

const RecentSearches = ({
  history,
  onSelect,
  onRemove,
  onClearAll,
}: RecentSearchesProps) => {
  const theme = useTheme();

  if (history.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Recent Searches</Text>
        <Pressable onPress={onClearAll}>
          <Text style={[styles.clearAll, { color: theme.primary }]}>Clear all</Text>
        </Pressable>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(item);
            }}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="time-outline" size={20} color={theme.tertiaryText} />
              <Text style={[styles.itemText, { color: theme.text }]}>{item}</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRemove(item);
              }}
              hitSlop={10}
            >
              <Ionicons name="close" size={18} color={theme.tertiaryText} />
            </Pressable>
          </Pressable>
        )}
        scrollEnabled={false} // Since it's likely part of a larger scroll view
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  clearAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    fontSize: 16,
    marginLeft: 12,
  },
});

export default RecentSearches;
