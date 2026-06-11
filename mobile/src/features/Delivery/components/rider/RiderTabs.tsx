import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import { riderTabs } from "../../theme/riderTheme";
import type { RiderStyles, RiderTab } from "../../types/rider.types";

export function RiderTabs({
  styles,
  theme,
  activeTab,
  onTabChange,
}: {
  styles: RiderStyles;
  theme: Theme;
  activeTab: RiderTab;
  onTabChange: (tab: RiderTab) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
      {riderTabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, selected && styles.tabSelected]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.85}
          >
            <Ionicons name={tab.icon} size={16} color={selected ? "#fff" : theme.secondaryText} />
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
