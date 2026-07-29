import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductCategorySelectorProps {
  theme: Theme;
  styles: any;
  categories: any[] | undefined;
  category: string;
  setCategory: (v: string) => void;
  subCategory: string;
  setSubCategory: (v: string) => void;
  errors?: any;
}

const ProductCategorySelector = ({
  theme,
  styles,
  categories,
  category,
  setCategory,
  subCategory,
  setSubCategory,
  errors,
}: ProductCategorySelectorProps) => {
  // Filter parent/root categories (no parentId)
  const rootCategories = categories?.filter((cat) => !cat.parentId) || [];

  // Find the selected parent category document
  const selectedRootDoc = categories?.find((cat) => cat.title === category);

  // Filter subcategories matching the selected parent category's ID
  const subCategories = selectedRootDoc
    ? categories?.filter((cat) => {
        const pId = typeof cat.parentId === "object" ? cat.parentId?._id : cat.parentId;
        return pId === selectedRootDoc._id;
      }) || []
    : [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {rootCategories.map((cat) => (
          <TouchableOpacity
            key={cat._id}
            style={[styles.categoryChip, category === cat.title && styles.categoryChipActive]}
            onPress={() => {
              setCategory(cat.title);
              setSubCategory(""); // Reset subcategory when parent changes
            }}
          >
            <Image source={{ uri: cat.image }} style={styles.chipImage} />
            <Text style={[styles.categoryChipText, category === cat.title && styles.categoryChipTextActive]}>
              {cat.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Render subcategories if available */}
      {subCategories.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { fontSize: 13, opacity: 0.8, marginBottom: 8 }]}>
            Subcategory
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {subCategories.map((sub) => (
              <TouchableOpacity
                key={sub._id}
                style={[
                  styles.categoryChip,
                  subCategory === sub.title && styles.categoryChipActive,
                  { paddingHorizontal: 16, height: 36, justifyContent: "center" },
                ]}
                onPress={() => setSubCategory(sub.title)}
              >
                <Text style={[styles.categoryChipText, subCategory === sub.title && styles.categoryChipTextActive]}>
                  {sub.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TextInput
        style={[styles.input, { marginTop: 8 }, errors?.category && styles.inputError]}
        value={category}
        onChangeText={(text) => {
          setCategory(text);
          setSubCategory("");
        }}
        placeholder="Custom category..."
        placeholderTextColor={theme.tertiaryText}
      />
      {errors?.category && <Text style={styles.errorText}>{errors.category}</Text>}
    </View>
  );
};

export default ProductCategorySelector;
