import React from "react";
import { View, Text, TextInput, Switch } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductDeliveryInfoProps {
  theme: Theme;
  styles: any;
  isExpressAvailable: boolean;
  setIsExpressAvailable: (v: boolean) => void;
  estimatedDays: string;
  setEstimatedDays: (v: string) => void;
  errors?: any;
}

const ProductDeliveryInfo = ({
  theme,
  styles,
  isExpressAvailable,
  setIsExpressAvailable,
  estimatedDays,
  setEstimatedDays,
  errors,
}: ProductDeliveryInfoProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Delivery Information</Text>
      <View style={[styles.row, { alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}>
        <Text style={styles.label}>Express Delivery Available</Text>
        <Switch
          value={isExpressAvailable}
          onValueChange={setIsExpressAvailable}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={isExpressAvailable ? "#fff" : "#f4f3f4"}
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
    </View>
  );
};

export default ProductDeliveryInfo;
