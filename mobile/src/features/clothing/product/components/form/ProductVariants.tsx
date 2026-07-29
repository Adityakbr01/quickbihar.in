import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PlusSignCircleIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { IVariant } from "../../types/product.types";

interface ProductVariantsProps {
  theme: Theme;
  styles: any;
  variants: IVariant[];
  addVariant: () => void;
  updateVariant: (index: number, field: keyof IVariant, value: any) => void;
  removeVariant: (index: number) => void;
  errors?: any;
}

const ProductVariants = ({
  theme,
  styles,
  variants,
  addVariant,
  updateVariant,
  removeVariant,
  errors,
}: ProductVariantsProps) => {
  return (
    <View style={styles.section}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Variants</Text>
        <TouchableOpacity onPress={addVariant} style={{ flexDirection: "row", alignItems: "center" }}>
          <HugeiconsIcon icon={PlusSignCircleIcon} size={20} color={theme.primary} />
          <Text style={{ marginLeft: 4, color: theme.primary, fontWeight: "600" }}>Add</Text>
        </TouchableOpacity>
      </View>

      {variants.map((variant, index) => (
        <View key={index}>
          <View style={[styles.variantRow, errors?.variants?.[index] && { borderColor: theme.error, borderWidth: 1 }]}>
            <TextInput
              style={[styles.variantInput, { flex: 0.6 }]}
              value={variant.size}
              onChangeText={(v) => updateVariant(index, "size", v)}
              placeholder="Size"
              placeholderTextColor={theme.tertiaryText}
            />
            <TextInput
              style={[styles.variantInput, { flex: 1 }]}
              value={variant.color}
              onChangeText={(v) => updateVariant(index, "color", v)}
              placeholder="Color"
              placeholderTextColor={theme.tertiaryText}
            />
            <TextInput
              style={[styles.variantInput, { flex: 0.6 }]}
              value={String(variant.stock)}
              onChangeText={(v) => updateVariant(index, "stock", v === "" ? 0 : Number(v))}
              keyboardType="numeric"
              placeholder="Stock"
              placeholderTextColor={theme.tertiaryText}
            />
            <TextInput
              style={[styles.variantInput, { flex: 0.8, opacity: 0.6, backgroundColor: theme.tertiaryBackground }]}
              value={variant.sku || "Auto-gen"}
              editable={false}
              placeholder="SKU"
              placeholderTextColor={theme.tertiaryText}
            />
            <TouchableOpacity onPress={() => removeVariant(index)}>
              <HugeiconsIcon icon={Delete02Icon} size={18} color={theme.error} />
            </TouchableOpacity>
          </View>
          {errors?.variants?.[index] && (
            <Text style={[styles.errorText, { marginTop: -8, marginBottom: 8 }]}>
              {Object.values(errors.variants[index])[0] as string}
            </Text>
          )}
        </View>
      ))}
      {errors?.variants && typeof errors.variants === "string" && (
        <Text style={styles.errorText}>{errors.variants}</Text>
      )}
    </View>
  );
};

export default ProductVariants;
