import React from "react";
import { CircleAlert, ShieldCheck } from "lucide-react";
import { Controller } from "react-hook-form";
import { useTheme, type Theme } from "@/src/theme/Provider/ThemeProvider";
import { TextInput } from "@/src/theme/components/TextInput";
import { cn } from "@/src/lib/utils";

interface ProfileEditFormProps {
  control: any;
  errors: any;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  theme?: Theme;
  styles?: any;
  // Phone OTP verification props
  currentPhone?: string;
  isPhoneVerified?: boolean;
  phoneChanged?: boolean;
  onRequestPhoneVerify?: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  control,
  errors,
  onSubmit,
  onCancel,
  isLoading,
  theme: themeProp,
  currentPhone,
  isPhoneVerified,
  phoneChanged,
  onRequestPhoneVerify,
}) => {
  const hookTheme = useTheme();
  const theme = (themeProp ?? hookTheme) as Theme;

  return (
    <div
      className={cn("rounded-[20px] p-5 shadow-lg")}
      style={{ backgroundColor: theme.background }}
    >
      <div className="mb-5">
        <label
          className="mb-2 block text-sm font-semibold"
          style={{ color: theme.secondaryText }}
        >
          Full Name
        </label>
        <Controller control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Full Name"
              placeholderTextColor={theme.tertiaryText}
              error={errors.fullName?.message}
              containerStyle={{ marginBottom: 0 }}
              style={{ color: theme.text }}
            />
          )}
        />
      </div>

      {/* Phone — read-only, must verify via OTP to change */}
      <div className="mb-5">
        <label
          className="mb-2 block text-sm font-semibold"
          style={{ color: theme.secondaryText }}
        >
          Phone Number
        </label>
        <div className="flex flex-row items-center gap-2">
          <TextInput value={currentPhone}
            placeholder="Tap Verify to add"
            placeholderTextColor={theme.tertiaryText}
            editable={false}
            keyboardType="phone-pad"
            error={errors.phone?.message}
            containerStyle={{ marginBottom: 0, flex: 1 }}
            style={{ color: theme.text }}
          />
          {onRequestPhoneVerify && (
            <button
              type="button"
              onClick={onRequestPhoneVerify}
              className="px-[14px] py-[10px] rounded-[10px] border"
              style={{
                backgroundColor: theme.primary + "18",
                borderColor: theme.primary + "44",
              }}
            >
              <span
                className="text-[13px] font-bold"
                style={{ color: theme.primary }}
              >
                {isPhoneVerified ? "Change" : "Verify"}
              </span>
            </button>
          )}
        </div>
        {isPhoneVerified ? (
          <div className="mt-[5px] flex flex-row items-center gap-[5px]">
            <ShieldCheck size={14} color="#16a34a" />
            <span className="text-xs font-bold" style={{ color: "#16a34a" }}>
              Verified
            </span>
          </div>
        ) : phoneChanged ? (
          <div className="mt-[5px] flex flex-row items-center gap-1">
            <CircleAlert size={14} color="#ea580c" />
            <span className="text-xs font-semibold" style={{ color: "#ea580c" }}>
              Please verify this number before saving
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-row gap-[15px]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex h-14 flex-1 items-center justify-center rounded-2xl border disabled:opacity-50"
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
          }}
        >
          <span
            className="text-base font-bold"
            style={{ color: theme.text }}
          >
            Cancel
          </span>
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="flex h-14 flex-[2] items-center justify-center rounded-2xl disabled:opacity-60"
          style={{ backgroundColor: theme.primary }}
        >
          {isLoading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <span className="text-base font-bold text-white">Save Changes</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileEditForm;
