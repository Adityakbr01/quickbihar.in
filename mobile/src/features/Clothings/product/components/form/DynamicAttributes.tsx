import React from "react";
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface Attribute {
  _id: string;
  name: string;
  type: "text" | "number" | "select" | "boolean";
  required: boolean;
  options?: string[];
  group: "BASIC" | "ADVANCED";
}

interface DynamicAttributesProps {
  theme: Theme;
  attributes: Attribute[];
  values: Record<string, any>;
  onValueChange: (name: string, value: any) => void;
  errors?: any;
}

const DynamicAttributes = ({
  theme,
  attributes,
  values,
  onValueChange,
  errors
}: DynamicAttributesProps) => {
  if (!attributes || attributes.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Specifications</Text>
      
      {attributes.map((attr) => (
        <View key={attr._id} style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            {attr.name} {attr.required && <Text style={{ color: theme.error }}>*</Text>}
          </Text>

          {attr.type === "text" || attr.type === "number" ? (
            <TextInput
              style={[
                styles.input,
                { 
                    backgroundColor: theme.secondaryBackground, 
                    color: theme.text,
                    borderColor: errors?.[`details.${attr.name}`] ? theme.error : theme.border
                }
              ]}
              value={values[attr.name]?.toString() || ""}
              onChangeText={(val) => onValueChange(attr.name, attr.type === "number" ? Number(val) : val)}
              placeholder={`Enter ${attr.name.toLowerCase()}...`}
              placeholderTextColor={theme.tertiaryText}
              keyboardType={attr.type === "number" ? "numeric" : "default"}
            />
          ) : attr.type === "select" ? (
            <View style={styles.optionsContainer}>
              {attr.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionChip,
                    { borderColor: theme.border },
                    values[attr.name] === option && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => onValueChange(attr.name, option)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: theme.secondaryText },
                    values[attr.name] === option && { color: "#fff" }
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : attr.type === "boolean" ? (
            <View style={styles.switchRow}>
              <Text style={{ color: theme.secondaryText }}>{values[attr.name] ? "Yes" : "No"}</Text>
              <Switch
                value={!!values[attr.name]}
                onValueChange={(val) => onValueChange(attr.name, val)}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
          ) : null}
          
          {errors?.[`details.${attr.name}`] && (
            <Text style={styles.errorText}>{errors[`details.${attr.name}`]}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: 12,
    marginTop: 4,
  }
});

export default DynamicAttributes;
