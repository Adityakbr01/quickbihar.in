import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductCategorySelectorProps {
  theme: Theme;
  styles: any;
  categories: any[] | undefined;
  category: string;
  setCategory: (v: string) => void;
  errors?: any;
}

const ProductCategorySelector = ({
  theme,
  styles,
  categories,
  category,
  setCategory,
  errors,
}: ProductCategorySelectorProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories?.map((cat) => (
          <TouchableOpacity
            key={cat._id}
            style={[styles.categoryChip, category === cat.title && styles.categoryChipActive]}
            onPress={() => setCategory(cat.title)}
          >
            <Image source={{ uri: cat.image }} style={styles.chipImage} />
            <Text style={[styles.categoryChipText, category === cat.title && styles.categoryChipTextActive]}>
              {cat.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TextInput
        style={[styles.input, { marginTop: 8 }, errors?.category && styles.inputError]}
        value={category}
        onChangeText={setCategory}
        placeholder="Custom category..."
        placeholderTextColor={theme.tertiaryText}
      />
      {errors?.category && <Text style={styles.errorText}>{errors.category}</Text>}
    </View>
  );
};

export default ProductCategorySelector;
