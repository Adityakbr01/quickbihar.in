import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Theme, useTheme } from "@/src/theme/Provider/ThemeProvider";
import { ISizeChart } from "../types/sizeChart.types";
import { AiEditingIcon, Delete02Icon, TableIcon } from "@hugeicons/core-free-icons";

interface SizeChartListProps {
  charts: ISizeChart[];
  onEdit: (chart: ISizeChart) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const SizeChartList = ({ charts, onEdit, onDelete, loading }: SizeChartListProps) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />;
  }

  if (charts.length === 0) {
    return (
      <View style={styles.empty}>
        <HugeiconsIcon icon={TableIcon} size={48} color={theme.tertiaryText} />
        <Text style={styles.emptyText}>No size charts found</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ISizeChart }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>
          {item.category} • {item.unit} • {item.data.length} Sizes
        </Text>
        <View style={styles.fieldsContainer}>
          {item.fields.map((f, i) => (
            <View key={i} style={styles.fieldBadge}>
              <Text style={styles.fieldBadgeText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
          <HugeiconsIcon icon={AiEditingIcon} size={20} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item._id)} style={styles.actionBtn}>
          <HugeiconsIcon icon={Delete02Icon} size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={charts}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: {
      paddingVertical: 20,
      paddingHorizontal: 20
    },
    card: {
      backgroundColor: theme.background,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 13,
      color: theme.tertiaryText,
      marginBottom: 8,
    },
    fieldsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    fieldBadge: {
      backgroundColor: theme.tertiaryBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 6,
      marginBottom: 4,
    },
    fieldBadgeText: {
      fontSize: 10,
      color: theme.tertiaryText,
      textTransform: "uppercase",
      fontWeight: "600",
    },
    cardActions: {
      flexDirection: "row",
    },
    actionBtn: {
      padding: 8,
      marginLeft: 8,
    },
    empty: {
      alignItems: "center",
      marginTop: 60,
    },
    emptyText: {
      marginTop: 12,
      color: theme.tertiaryText,
      fontSize: 16,
    },
  });

export default SizeChartList;
