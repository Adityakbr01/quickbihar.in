import React from "react";
import { View, Text, TextInput } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductPricingProps {
  theme: Theme;
  styles: any;
  price: string;
  setPrice: (v: string) => void;
  originalPrice: string;
  setOriginalPrice: (v: string) => void;
  errors?: any;
}

const ProductPricing = ({
  theme,
  styles,
  price,
  setPrice,
  originalPrice,
  setOriginalPrice,
  errors,
}: ProductPricingProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pricing</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Price (INR)</Text>
          <TextInput
            style={[styles.input, errors?.price && styles.inputError]}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="999"
            placeholderTextColor={theme.tertiaryText}
          />
          {errors?.price && <Text style={styles.errorText}>{errors.price}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Original Price</Text>
          <TextInput
            style={[styles.input, errors?.originalPrice && styles.inputError]}
            value={originalPrice}
            onChangeText={setOriginalPrice}
            keyboardType="numeric"
            placeholder="1499"
            placeholderTextColor={theme.tertiaryText}
          />
          {errors?.originalPrice && <Text style={styles.errorText}>{errors.originalPrice}</Text>}
        </View>
      </View>
    </View>
  );
};

export default ProductPricing;
