import React from "react";
import { View, Text, TextInput, Switch } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductDeliveryInfoProps {
  theme: Theme;
  styles: any;
  isExpressAvailable: boolean;
  setIsExpressAvailable: (v: boolean) => void;
  isCodAvailable: boolean;
  setIsCodAvailable: (v: boolean) => void;
  estimatedDays: string;
  setEstimatedDays: (v: string) => void;
  returnPolicy: string;
  setReturnPolicy: (v: string) => void;
  errors?: any;
}

const ProductDeliveryInfo = ({
  theme,
  styles,
  isExpressAvailable,
  setIsExpressAvailable,
  isCodAvailable,
  setIsCodAvailable,
  estimatedDays,
  setEstimatedDays,
  returnPolicy,
  setReturnPolicy,
  errors,
}: ProductDeliveryInfoProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Delivery Information</Text>
      
      <View style={[styles.row, { alignItems: "center", justifyContent: "space-between", marginBottom: 12 }]}>
        <Text style={styles.label}>Express Delivery Available</Text>
        <Switch
          value={isExpressAvailable}
          onValueChange={setIsExpressAvailable}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={isExpressAvailable ? "#fff" : "#f4f3f4"}
        />
      </View>

      <View style={[styles.row, { alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}>
        <Text style={styles.label}>Cash on Delivery (COD) Available</Text>
        <Switch
          value={isCodAvailable}
          onValueChange={setIsCodAvailable}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={isCodAvailable ? "#fff" : "#f4f3f4"}
        />
      </View>

      <Text style={styles.label}>Estimated Delivery Days</Text>
      <TextInput
        style={[styles.input, errors?.estimatedDays && styles.inputError]}
        value={estimatedDays}
        onChangeText={setEstimatedDays}
        keyboardType="numeric"
        placeholder="3"
        placeholderTextColor={theme.tertiaryText}
      />
      {errors?.estimatedDays && <Text style={styles.errorText}>{errors.estimatedDays}</Text>}

      <Text style={styles.label}>Custom Return Policy Statement (Optional)</Text>
      <TextInput
        style={styles.input}
        value={returnPolicy}
        onChangeText={setReturnPolicy}
        placeholder="e.g., 7 days easy return"
        placeholderTextColor={theme.tertiaryText}
      />
      <Text style={{ fontSize: 11, color: theme.tertiaryText, marginTop: -8 }}>
        This will be displayed alongside the official Refund Policy.
      </Text>
    </View>
  );
};

export default ProductDeliveryInfo;
