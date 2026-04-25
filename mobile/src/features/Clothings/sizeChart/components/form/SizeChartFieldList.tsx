import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CheckmarkCircle02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface SizeChartFieldListProps {
  fields: string[];
  onAddField: () => void;
  onRemoveField: (index: number) => void;
  onUpdateFieldName: (index: number, name: string) => void;
  styles: any;
  theme: Theme;
}

const SizeChartFieldList = ({
  fields,
  onAddField,
  onRemoveField,
  onUpdateFieldName,
  styles,
  theme,
}: SizeChartFieldListProps) => {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fields (Columns)</Text>
        <TouchableOpacity onPress={onAddField} style={styles.addBtn}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={theme.primary} />
          <Text style={styles.addBtnText}>Add Field</Text>
        </TouchableOpacity>
      </View>

      {fields.map((field, index) => (
        <View key={index} style={styles.fieldRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={field}
            onChangeText={(val) => onUpdateFieldName(index, val)}
            placeholder="Field Name"
            placeholderTextColor={theme.tertiaryText}
          />
          <TouchableOpacity onPress={() => onRemoveField(index)} style={styles.deleteBtn}>
            <HugeiconsIcon icon={Delete02Icon} size={20} color={theme.error} />
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
};

export default SizeChartFieldList;
