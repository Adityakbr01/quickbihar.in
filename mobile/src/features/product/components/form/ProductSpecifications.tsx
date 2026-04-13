import React from "react";
import { View, Text, TextInput } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProductSpecificationsProps {
  theme: Theme;
  styles: any;
  fit: string;
  setFit: (v: string) => void;
  pattern: string;
  setPattern: (v: string) => void;
  sleeve: string;
  setSleeve: (v: string) => void;
  washCare: string;
  setWashCare: (v: string) => void;
}

const ProductSpecifications = ({
  theme,
  styles,
  fit,
  setFit,
  pattern,
  setPattern,
  sleeve,
  setSleeve,
  washCare,
  setWashCare,
}: ProductSpecificationsProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Product Specifications</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Fit</Text>
          <TextInput
            style={styles.input}
            value={fit}
            onChangeText={setFit}
            placeholder="e.g., Regular Fit"
            placeholderTextColor={theme.tertiaryText}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Pattern</Text>
          <TextInput
            style={styles.input}
            value={pattern}
            onChangeText={setPattern}
            placeholder="e.g., Solid"
            placeholderTextColor={theme.tertiaryText}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Sleeve</Text>
          <TextInput
            style={styles.input}
            value={sleeve}
            onChangeText={setSleeve}
            placeholder="e.g., Short Sleeve"
            placeholderTextColor={theme.tertiaryText}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Wash Care</Text>
          <TextInput
            style={styles.input}
            value={washCare}
            onChangeText={setWashCare}
            placeholder="e.g., Machine Wash"
            placeholderTextColor={theme.tertiaryText}
          />
        </View>
      </View>
    </View>
  );
};

export default ProductSpecifications;
