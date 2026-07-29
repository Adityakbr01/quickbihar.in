import React from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CheckmarkCircle02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { ISizeChartRow } from "../../types/sizeChart.types";

interface SizeChartDataTableProps {
  fields: string[];
  data: ISizeChartRow[];
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateCell: (rowIndex: number, field: string, value: string) => void;
  styles: any;
  theme: Theme;
}

const SizeChartDataTable = ({
  fields,
  data,
  onAddRow,
  onRemoveRow,
  onUpdateCell,
  styles,
  theme,
}: SizeChartDataTableProps) => {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Chart Data (Rows)</Text>
        <TouchableOpacity onPress={onAddRow} style={styles.addBtn}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={theme.primary} />
          <Text style={styles.addBtnText}>Add Row</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View style={styles.tableRow}>
            {fields.map((field, i) => (
              <View key={i} style={[styles.tableCell, { width: 100, backgroundColor: theme.background }]}>
                <Text style={styles.tableHeaderText}>{field || "Field"}</Text>
              </View>
            ))}
            <View style={{ width: 50 }} />
          </View>

          {/* Data Rows */}
          {data.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              {fields.map((field, cellIndex) => {
                // BUG FIX: Handle case-sensitivity issues (e.g., field label "Size" vs data key "size")
                let value = row[field];
                
                // If the field label is "Size" but row[field] is empty, check for row["size"]
                if ((value === undefined || value === "") && field.toLowerCase() === "size") {
                  value = row["size"];
                  if (value !== undefined && value !== "") {
                    // console.debug(`[SizeChartForm] Mapping "size" data to "${field}" column for row ${rowIndex}`);
                  }
                }

                return (
                  <TextInput
                    key={cellIndex}
                    style={[styles.tableCellInput, { width: 100 }]}
                    value={String(value || "")}
                    onChangeText={(val) => onUpdateCell(rowIndex, field, val)}
                    placeholder="..."
                    placeholderTextColor={theme.tertiaryText}
                  />
                );
              })}
              <TouchableOpacity onPress={() => onRemoveRow(rowIndex)} style={styles.rowDeleteBtn}>
                <HugeiconsIcon icon={Delete02Icon} size={16} color={theme.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

export default SizeChartDataTable;
