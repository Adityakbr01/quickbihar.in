import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import type { RiderProfile } from "../../api/delivery.api";
import type { ProfileForm, RiderStyles } from "../../types/rider.types";
import { SectionTitle, StatusPill } from "./RiderShared";
import { TextInput } from "@/src/theme/components/TextInput";
import { riderInputChrome } from "../../styles/rider.styles";

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
    <View style={styles.panel}>
      <SectionTitle
        styles={styles}
        title="Profile"
        meta={profile?.status || ""}
      />
      <View style={[styles.noticeCard, canAcceptOffers ? styles.noticeSuccess : styles.noticeWarning]}>
        <View style={styles.rowBetween}>
          <View style={styles.flexOne}>
            <Text style={styles.noticeTitle}>{statusTitle}</Text>
            <Text style={styles.noticeCopy}>{statusCopy}</Text>
          </View>
          <StatusPill styles={styles} status={canAcceptOffers ? "APPROVED" : profile?.status || "PENDING"} />
        </View>
        {missingFields.length > 0 && (
          <View style={styles.miniChipRow}>
            {missingFields.map((field) => (
              <Text key={field} style={styles.miniChip}>{field}</Text>
            ))}
          </View>
        )}
        {requiresApprovalAfterSave && canAcceptOffers && (
          <View style={styles.warningLine}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.warning} />
            <Text style={styles.warningLineText}>Sensitive changes will send this profile for admin approval again.</Text>
          </View>
        )}
      </View>
      <View style={styles.formCard}>
        <TextInput
          {...inputChrome}
          value={profileForm.phone}
          onChangeText={(value) => onFieldChange("phone", value)}
          placeholder="Phone"
          placeholderTextColor={theme.secondaryText}
          keyboardType="phone-pad"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.vehicleType}
          onChangeText={(value) => onFieldChange("vehicleType", value)}
          placeholder="Vehicle type"
          placeholderTextColor={theme.secondaryText}
        />
        <TextInput
          {...inputChrome}
          value={profileForm.vehicleNumber}
          onChangeText={(value) => onFieldChange("vehicleNumber", value)}
          placeholder="Vehicle number"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="characters"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.licenseNumber}
          onChangeText={(value) => onFieldChange("licenseNumber", value)}
          placeholder="License number"
          placeholderTextColor={theme.secondaryText}
        />
        <TextInput
          {...inputChrome}
          value={profileForm.address}
          onChangeText={(value) => onFieldChange("address", value)}
          placeholder="Address"
          placeholderTextColor={theme.secondaryText}
          multiline
          inputContainerStyle={{ ...inputChrome.inputContainerStyle, minHeight: 88 }}
          style={[inputChrome.style, { textAlignVertical: "top" }]}
        />
        <View style={styles.inlineInputs}>
          <TextInput
            {...inputChrome}
            value={profileForm.city}
            onChangeText={(value) => onFieldChange("city", value)}
            placeholder="City"
            placeholderTextColor={theme.secondaryText}
            containerStyle={{ marginBottom: 0, flex: 1 }}
          />
          <TextInput
            {...inputChrome}
            value={profileForm.state}
            onChangeText={(value) => onFieldChange("state", value)}
            placeholder="State"
            placeholderTextColor={theme.secondaryText}
            containerStyle={{ marginBottom: 0, flex: 1 }}
          />
        </View>
        <TextInput
          {...inputChrome}
          value={profileForm.pincode}
          onChangeText={(value) => onFieldChange("pincode", value)}
          placeholder="Pincode"
          placeholderTextColor={theme.secondaryText}
          keyboardType="number-pad"
        />
      </View>

      <SectionTitle styles={styles} title="Bank Details" meta="" />
      <View style={styles.formCard}>
        <TextInput
          {...inputChrome}
          value={profileForm.upi}
          onChangeText={(value) => onFieldChange("upi", value)}
          placeholder="UPI"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="none"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.accountNumber}
          onChangeText={(value) => onFieldChange("accountNumber", value)}
          placeholder="Account number"
          placeholderTextColor={theme.secondaryText}
          keyboardType="number-pad"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.ifsc}
          onChangeText={(value) => onFieldChange("ifsc", value)}
          placeholder="IFSC"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="characters"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.bankName}
          onChangeText={(value) => onFieldChange("bankName", value)}
          placeholder="Bank name"
          placeholderTextColor={theme.secondaryText}
        />
        <TextInput
          {...inputChrome}
          value={profileForm.pan}
          onChangeText={(value) => onFieldChange("pan", value)}
          placeholder="PAN"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="characters"
        />
        <TextInput
          {...inputChrome}
          value={profileForm.aadhar}
          onChangeText={(value) => onFieldChange("aadhar", value)}
          placeholder="Aadhar"
          placeholderTextColor={theme.secondaryText}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onSaveProfile}
          disabled={busy}
        >
          <Ionicons name="save-outline" size={16} color="#fff" />
          <Text style={styles.primaryText}>{saveLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
