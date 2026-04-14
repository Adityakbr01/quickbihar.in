import React from "react";
import { View, Text, TextInput } from "react-native";
import { Controller } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface AddressInputProps {
  control: any;
  name: string;
  label: string;
  icon: any;
  placeholder: string;
  errors: any;
  theme: Theme;
  styles: any;
  options?: any;
}

const AddressInput: React.FC<AddressInputProps> = ({
  control,
  name,
  label,
  icon,
  placeholder,
  errors,
  theme,
  styles,
  options = {},
}) => {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <HugeiconsIcon icon={icon} size={18} color={theme.secondaryText} />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              options.multiline && styles.textArea,
              errors[name] && { borderColor: theme.error },
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value?.toString()}
            placeholder={placeholder}
            placeholderTextColor={theme.tertiaryText}
            {...options}
          />
        )}
      />
      {errors[name] && (
        <Text style={styles.errorText}>{errors[name]?.message as string}</Text>
      )}
    </View>
  );
};

export default AddressInput;
