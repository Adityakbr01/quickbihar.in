import React from "react";
import { View, Text, TextInput } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductComplianceProps {
  theme: Theme;
  styles: any;
  manufacturerDetail: string;
  setManufacturerDetail: (v: string) => void;
  packerDetail: string;
  setPackerDetail: (v: string) => void;
  countryOfOrigin: string;
  setCountryOfOrigin: (v: string) => void;
}

const ProductCompliance = ({
  theme,
  styles,
  manufacturerDetail,
  setManufacturerDetail,
  packerDetail,
  setPackerDetail,
  countryOfOrigin,
  setCountryOfOrigin,
}: ProductComplianceProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Compliance Details</Text>
      
      <Text style={styles.label}>Manufacturer Detail (Optional)</Text>
      <TextInput
        style={styles.input}
        value={manufacturerDetail}
        onChangeText={setManufacturerDetail}
        placeholder="Enter manufacturer name and address"
        placeholderTextColor={theme.tertiaryText}
        multiline
      />

      <Text style={styles.label}>Packer Detail (Optional)</Text>
      <TextInput
        style={styles.input}
        value={packerDetail}
        onChangeText={setPackerDetail}
        placeholder="Enter packer name and address"
        placeholderTextColor={theme.tertiaryText}
        multiline
      />

      <Text style={styles.label}>Country of Origin</Text>
      <TextInput
        style={styles.input}
        value={countryOfOrigin}
        onChangeText={setCountryOfOrigin}
        placeholder="e.g., India"
        placeholderTextColor={theme.tertiaryText}
      />
    </View>
  );
};

export default ProductCompliance;
