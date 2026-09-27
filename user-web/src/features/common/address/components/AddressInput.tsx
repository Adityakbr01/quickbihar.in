import React from "react";
import { View, Text } from "react-native";
import { Controller } from "react-hook-form";
import { AppIcon } from "@/src/components/common/AppIcon";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { TextInput } from "@/src/theme/components/TextInput";

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
        <AppIcon name={icon} size={18} color={theme.secondaryText} />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => {
          // Compose caller's onChangeText with RHF onChange so both fire.
          const { onChangeText: callerOnChangeText, ...restOptions } = options;
          const multiline = Boolean(options.multiline);
          return (
            <TextInput
              onBlur={onBlur}
              onChangeText={(v) => {
                onChange(v);
                callerOnChangeText?.(v);
              }}
              value={value?.toString()}
              placeholder={placeholder}
              placeholderTextColor={theme.tertiaryText}
              error={errors[name]?.message as string | undefined}
              containerStyle={{ marginBottom: 0 }}
              inputContainerStyle={{
                backgroundColor: theme.tertiaryBackground,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: multiline ? 100 : 56,
              }}
              style={{
                fontSize: 16,
                color: theme.text,
                ...(multiline ? { paddingTop: 16, textAlignVertical: "top" as const } : {}),
              }}
              {...restOptions}
            />
          );
        }}
      />
    </View>
  );
};

export default AddressInput;
