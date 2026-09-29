import React from "react";
import { Controller } from "react-hook-form";
import { AppIcon } from "@/src/components/common/AppIcon";
import type { LucideIcon } from "lucide-react";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { TextInput } from "@/src/theme/components/TextInput";

interface AddressInputProps {
  control: any;
  name: string;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  errors: any;
  theme: Theme;
  styles?: any;
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
  options = {},
}) => {
  return (
    <div className="mb-5">
      <div className="mb-2 flex flex-row items-center">
        <AppIcon icon={icon} size={18} color={(theme as any).secondaryText} />
        <label
          className="ml-2 text-sm font-semibold"
          style={{ color: (theme as any).secondaryText }}
        >
          {label}
        </label>
      </div>
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
              onChangeText={(v: string) => {
                onChange(v);
                callerOnChangeText?.(v);
              }}
              value={value?.toString()}
              placeholder={placeholder}
              placeholderTextColor={(theme as any).tertiaryText}
              error={errors[name]?.message as string | undefined}
              containerStyle={{ marginBottom: 0 }}
              inputContainerStyle={{
                backgroundColor: (theme as any).tertiaryBackground,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: multiline ? 100 : 56,
              }}
              style={{
                fontSize: 16,
                color: (theme as any).text,
                ...(multiline ? { paddingTop: 16, textAlignVertical: "top" as const } : {}),
              }}
              {...restOptions}
            />
          );
        }}
      />
    </div>
  );
};

export default AddressInput;
