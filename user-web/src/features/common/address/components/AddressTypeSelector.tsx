import React from "react";
import { View, Text, TouchableOpacity } from "@/components/primitives";
import * as Haptics from "@/lib/haptics";
import { AddressType } from "../schema/address.schema";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface AddressTypeSelectorProps {
  selectedType: AddressType;
  onSelect: (type: AddressType) => void;
  theme: Theme;
  styles: any;
}

const AddressTypeSelector: React.FC<AddressTypeSelectorProps> = ({
  selectedType,
  onSelect,
  theme,
  styles,
}) => {
  return (
    <View style={styles.typeSelector}>
      {Object.values(AddressType).map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.typeOption,
            selectedType === type && styles.selectedTypeOption,
          ]}
          onPress={() => {
            onSelect(type);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text
            style={[
              styles.typeOptionText,
              selectedType === type && styles.selectedTypeOptionText,
            ]}
          >
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default AddressTypeSelector;
