import React from "react";
import { View, Text, TextInput, Switch, StyleSheet } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductPricingProps {
  theme: Theme;
  styles: any;
  price: string;
  setPrice: (v: string) => void;
  originalPrice: string;
  setOriginalPrice: (v: string) => void;
  isGstApplicable: boolean;
  setIsGstApplicable: (v: boolean) => void;
  gstPercentage: string;
  setGstPercentage: (v: string) => void;
  errors?: any;
}

const ProductPricing = ({
  theme,
  styles,
  price,
  setPrice,
  originalPrice,
  setOriginalPrice,
  isGstApplicable,
  setIsGstApplicable,
  gstPercentage,
  setGstPercentage,
  errors,
}: ProductPricingProps) => {
  const basePrice = Number(price) || 0;
  const gstRate = Number(gstPercentage) || 0;
  const finalPrice = isGstApplicable ? basePrice * (1 + gstRate / 100) : basePrice;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Price & Tax Information</Text>
      
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Base Price (₹)</Text>
          <TextInput
            style={[styles.input, errors?.price && styles.inputError]}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="e.g. 999"
            placeholderTextColor={theme.tertiaryText}
          />
          {errors?.price && <Text style={styles.errorText}>{errors.price}</Text>}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.label}>MRP (₹) [Optional]</Text>
          <TextInput
            style={styles.input}
            value={originalPrice}
            onChangeText={setOriginalPrice}
            keyboardType="numeric"
            placeholder="e.g. 1499"
            placeholderTextColor={theme.tertiaryText}
          />
        </View>
      </View>

      <View style={[styles.row, { alignItems: "center", justifyContent: "space-between", marginVertical: 8 }]}>
        <Text style={[styles.label, { marginBottom: 0 }]}>GST Applicable</Text>
        <Switch
          value={isGstApplicable}
          onValueChange={setIsGstApplicable}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={isGstApplicable ? "#fff" : "#f4f3f4"}
        />
      </View>

      {isGstApplicable && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>GST Percentage (%)</Text>
          <TextInput
            style={styles.input}
            value={gstPercentage}
            onChangeText={setGstPercentage}
            keyboardType="numeric"
            placeholder="e.g. 18"
            placeholderTextColor={theme.tertiaryText}
          />
        </View>
      )}

      {isGstApplicable && basePrice > 0 && (
        <View style={{ 
            backgroundColor: theme.primary + '10', 
            padding: 12, 
            borderRadius: 12, 
            borderWidth: 1, 
            borderColor: theme.primary,
            borderStyle: "dashed"
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: theme.secondaryText }}>Base Price:</Text>
            <Text style={{ fontSize: 13, color: theme.text, fontWeight: "600" }}>₹{basePrice.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: theme.secondaryText }}>GST ({gstRate}%):</Text>
            <Text style={{ fontSize: 13, color: theme.text, fontWeight: "600" }}>+₹{(finalPrice - basePrice).toLocaleString()}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 8 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 15, color: theme.text, fontWeight: "700" }}>Final Customer Price:</Text>
            <Text style={{ fontSize: 15, color: theme.primary, fontWeight: "800" }}>₹{finalPrice.toLocaleString()}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProductPricing;
