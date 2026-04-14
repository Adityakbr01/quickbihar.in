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
  discountPercentage: string;
  setDiscountPercentage: (v: string) => void;
  errors?: any;
}

const ProductPricing = ({
  theme,
  styles,
  price,
  setPrice,
  originalPrice,
  setOriginalPrice,
  discountPercentage,
  setDiscountPercentage,
  errors,
}: ProductPricingProps) => {

  const handlePriceChange = (val: string) => {
    setPrice(val);
    if (val && originalPrice && Number(originalPrice) > 0) {
      const disc = ((Number(originalPrice) - Number(val)) / Number(originalPrice)) * 100;
      setDiscountPercentage(disc.toFixed(0));
    }
  };

  const handleOriginalPriceChange = (val: string) => {
    setOriginalPrice(val);
    if (val && price && Number(val) > 0) {
      const disc = ((Number(val) - Number(price)) / Number(val)) * 100;
      setDiscountPercentage(disc.toFixed(0));
    } else if (val && discountPercentage && Number(val) > 0) {
        const p = Number(val) - (Number(val) * Number(discountPercentage)) / 100;
        setPrice(p.toFixed(0));
    }
  };

  const handleDiscountChange = (val: string) => {
    setDiscountPercentage(val);
    if (val && originalPrice && Number(originalPrice) > 0) {
      const p = Number(originalPrice) - (Number(originalPrice) * Number(val)) / 100;
      setPrice(p.toFixed(0));
    }
  };

  const savings = Number(originalPrice) - Number(price);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pricing</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Price (INR)</Text>
          <TextInput
            style={[styles.input, errors?.price && styles.inputError]}
            value={price}
            onChangeText={handlePriceChange}
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
            onChangeText={handleOriginalPriceChange}
            keyboardType="numeric"
            placeholder="1499"
            placeholderTextColor={theme.tertiaryText}
          />
          {errors?.originalPrice && <Text style={styles.errorText}>{errors.originalPrice}</Text>}
        </View>
      </View>

      <View style={[styles.row, { marginTop: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Discount (%)</Text>
          <TextInput
            style={[styles.input]}
            value={discountPercentage}
            onChangeText={handleDiscountChange}
            keyboardType="numeric"
            placeholder="20"
            placeholderTextColor={theme.tertiaryText}
          />
        </View>
        <View style={{ flex: 1, justifyContent: "center", paddingLeft: 10 }}>
           {savings > 0 && (
             <View style={{ backgroundColor: theme.primary + "10", padding: 8, borderRadius: 8 }}>
                <Text style={{ color: theme.primary, fontWeight: "600", fontSize: 13 }}>
                   Saves ₹{savings.toFixed(0)}
                </Text>
             </View>
           )}
        </View>
      </View>
    </View>
  );
};

export default ProductPricing;
