import React from "react";
import { CircleAlert, Save } from "lucide-react";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import type { RiderProfile } from "../../api/delivery.api";
import type { ProfileForm, RiderStyles } from "../../types/rider.types";
import { SectionTitle, StatusPill } from "./RiderShared";
import { TextInput } from "@/src/theme/components/TextInput";

const riderInputChrome = (theme: Theme) => ({
  containerStyle: { marginBottom: 0 },
  inputContainerStyle: {
    backgroundColor: theme.background,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 48,
  },
  style: { fontSize: 15, color: theme.text },
});

export function ProfilePanel({
  styles,
  theme,
  profile,
  profileForm,
  missingFields,
  canAcceptOffers,
  requiresApprovalAfterSave,
  busy,
  onFieldChange,
  onSaveProfile,
}: {
  styles: RiderStyles;
  theme: Theme;
  profile: RiderProfile | null;
  profileForm: ProfileForm;
  missingFields: string[];
  canAcceptOffers: boolean;
  requiresApprovalAfterSave: boolean;
  busy: boolean;
  onFieldChange: (key: keyof ProfileForm, value: string) => void;
  onSaveProfile: () => void;
}) {
  void styles;
  const needsProfile = missingFields.length > 0;
  const statusTitle = canAcceptOffers ? "Profile approved" : needsProfile ? "Complete your profile first" : "Admin approval pending";
  const statusCopy = canAcceptOffers
    ? "You can go online and accept delivery offers."
    : needsProfile
      ? "Fill all required rider details, then submit for admin approval."
      : "Admin needs to approve your rider profile before you can accept offers.";
  const saveLabel = canAcceptOffers && !requiresApprovalAfterSave ? "Save Profile" : "Submit for Approval";

  // Shared chrome for every rider form field (managed by theme TextInput).
  const inputChrome = riderInputChrome(theme);

  return (
    <div className="flex flex-col gap-3.5">
      <SectionTitle styles={styles} title="Profile" meta={profile?.status || ""} />
      <div
        className="flex flex-col gap-2.5 rounded-2xl border p-3.5"
        style={
          canAcceptOffers
            ? { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}55` }
            : { backgroundColor: `${theme.warning}12`, borderColor: `${theme.warning}55` }
        }
      >
        <div className="flex flex-row items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-sm font-black" style={{ color: theme.text }}>
              {statusTitle}
            </span>
            <span className="block text-xs leading-[17px]" style={{ color: theme.secondaryText }}>
              {statusCopy}
            </span>
          </div>
          <StatusPill styles={styles} status={canAcceptOffers ? "APPROVED" : profile?.status || "PENDING"} />
        </div>
        {missingFields.length > 0 && (
          <div className="flex flex-row flex-wrap gap-1.5">
            {missingFields.map((field) => (
              <span
                key={field}
                className="rounded-full border px-2 py-1 text-[11px] font-extrabold"
                style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border }}
              >
                {field}
              </span>
            ))}
          </div>
        )}
        {requiresApprovalAfterSave && canAcceptOffers && (
          <div
            className="flex flex-row items-center gap-1.5 rounded-xl px-2.5 py-2"
            style={{ backgroundColor: theme.background }}
          >
            <CircleAlert size={16} color={theme.warning} />
            <span className="flex-1 text-xs leading-4 font-extrabold" style={{ color: theme.warning }}>
              Sensitive changes will send this profile for admin approval again.
            </span>
          </div>
        )}
      </div>
      <div
        className="flex flex-col gap-2.5 rounded-2xl border p-3.5"
        style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
      >
        <TextInput
          {...inputChrome}
          value={profileForm.phone}
          onChangeText={(value: string) => onFieldChange("phone", value)}
          placeholder="Phone"
          placeholderTextColor={theme.secondaryText}
          keyboardType="phone-pad"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.vehicleType}
          onChangeText={(value: string) => onFieldChange("vehicleType", value)}
          placeholder="Vehicle type"
          placeholderTextColor={theme.secondaryText}
        />
        <TextInput
          {...inputChrome}
          value={profileForm.vehicleNumber}
          onChangeText={(value: string) => onFieldChange("vehicleNumber", value)}
          placeholder="Vehicle number"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="characters"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.licenseNumber}
          onChangeText={(value: string) => onFieldChange("licenseNumber", value)}
          placeholder="License number"
          placeholderTextColor={theme.secondaryText}
        />
        <TextInput
          {...inputChrome}
          value={profileForm.address}
          onChangeText={(value: string) => onFieldChange("address", value)}
          placeholder="Address"
          placeholderTextColor={theme.secondaryText}
          multiline
          inputContainerStyle={{ ...inputChrome.inputContainerStyle, minHeight: 88 }}
          style={[inputChrome.style, { textAlignVertical: "top" }]}
        />
        <div className="flex flex-row gap-2.5">
          <TextInput
            {...inputChrome}
            value={profileForm.city}
            onChangeText={(value: string) => onFieldChange("city", value)}
            placeholder="City"
            placeholderTextColor={theme.secondaryText}
            containerStyle={{ marginBottom: 0, flex: 1 }}
          />
          <TextInput
            {...inputChrome}
            value={profileForm.state}
            onChangeText={(value: string) => onFieldChange("state", value)}
            placeholder="State"
            placeholderTextColor={theme.secondaryText}
            containerStyle={{ marginBottom: 0, flex: 1 }}
          />
        </div>
        <TextInput
          {...inputChrome}
          value={profileForm.pincode}
          onChangeText={(value: string) => onFieldChange("pincode", value)}
          placeholder="Pincode"
          placeholderTextColor={theme.secondaryText}
          keyboardType="number-pad"
        />
      </div>

      <SectionTitle styles={styles} title="Bank Details" meta="" />
      <div
        className="flex flex-col gap-2.5 rounded-2xl border p-3.5"
        style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
      >
        <TextInput
          {...inputChrome}
          value={profileForm.upi}
          onChangeText={(value: string) => onFieldChange("upi", value)}
          placeholder="UPI"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="none"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.accountNumber}
          onChangeText={(value: string) => onFieldChange("accountNumber", value)}
          placeholder="Account number"
          placeholderTextColor={theme.secondaryText}
          keyboardType="number-pad"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.ifsc}
          onChangeText={(value: string) => onFieldChange("ifsc", value)}
          placeholder="IFSC"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="characters"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.bankName}
          onChangeText={(value: string) => onFieldChange("bankName", value)}
          placeholder="Bank name"
          placeholderTextColor={theme.secondaryText}
        />
        <TextInput
          {...inputChrome}
          value={profileForm.pan}
          onChangeText={(value: string) => onFieldChange("pan", value)}
          placeholder="PAN"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="characters"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.aadhar}
          onChangeText={(value: string) => onFieldChange("aadhar", value)}
          placeholder="Aadhar"
          placeholderTextColor={theme.secondaryText}
          keyboardType="number-pad"
        />
        <button
          type="button"
          onClick={onSaveProfile}
          disabled={busy}
          className="flex min-h-[46px] w-full cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[14px] px-3.5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: theme.primary }}
        >
          <Save size={16} color="#fff" />
          <span className="font-black text-white">{saveLabel}</span>
        </button>
      </div>
    </div>
  );
}
