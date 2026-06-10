import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductBasicInfoProps {
  theme: Theme;
  styles: any;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  errors?: any;
}

const ProductBasicInfo = ({
  theme,
  styles,
  title,
  setTitle,
  description,
  setDescription,
  brand,
  setBrand,
  tags,
  setTags,
  gender,
  setGender,
  errors,
}: ProductBasicInfoProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <Text style={styles.label}>Product Title</Text>
      <TextInput
        style={[styles.input, errors?.title && styles.inputError]}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., Premium Round Neck T-Shirt"
        placeholderTextColor={theme.tertiaryText}
      />
      {errors?.title && <Text style={styles.errorText}>{errors.title}</Text>}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: "top" }, errors?.description && styles.inputError]}
        value={description}
        onChangeText={setDescription}
        placeholder="Product description..."
        multiline
        placeholderTextColor={theme.tertiaryText}
      />
      {errors?.description && <Text style={styles.errorText}>{errors.description}</Text>}

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={[styles.input, errors?.brand && styles.inputError]}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g., Nike"
            placeholderTextColor={theme.tertiaryText}
          />
          {errors?.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Tags (comma-separated)</Text>
          <TextInput
            style={[styles.input, errors?.tags && styles.inputError]}
            value={tags}
            onChangeText={setTags}
            placeholder="shirt, cotton, casual"
            placeholderTextColor={theme.tertiaryText}
          />
          {errors?.tags && <Text style={styles.errorText}>{errors.tags}</Text>}
        </View>
      </View>

      <Text style={[styles.label, { marginTop: 12 }]}>Gender (Optional)</Text>
      <View style={[styles.row, { flexWrap: "wrap", gap: 8, marginTop: 4 }]}>
        {["Men", "Women", "Kids", "Unisex"].map((g) => (
          <TouchableOpacity
            key={g}
            style={[
              styles.categoryChip,
              gender === g && styles.categoryChipActive,
              { paddingHorizontal: 16, height: 36, justifyContent: "center" }
            ]}
            onPress={() => setGender(gender === g ? "" : g)}
          >
            <Text style={[styles.categoryChipText, gender === g && styles.categoryChipTextActive]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ProductBasicInfo;
