import React from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller } from "react-hook-form";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProfileEditFormProps {
  control: any;
  errors: any;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  theme: Theme;
  styles: any;
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
  theme,
  styles,
  currentPhone,
  isPhoneVerified,
  phoneChanged,
  onRequestPhoneVerify,
}) => {
  return (
    <View style={styles.infoCard}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                errors.fullName && { borderColor: theme.error },
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Full Name"
              placeholderTextColor={theme.tertiaryText}
            />
          )}
        />
        {errors.fullName && (
          <Text style={styles.errorText}>{errors.fullName.message}</Text>
        )}
      </View>

      {/* Phone — read-only, must verify via OTP to change */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput
            style={[
              styles.input,
              { flex: 1 },
              errors.phone && { borderColor: theme.error },
            ]}
            value={currentPhone}
            placeholder="Tap Verify to add"
            placeholderTextColor={theme.tertiaryText}
            editable={false}
            keyboardType="phone-pad"
          />
          {onRequestPhoneVerify && (
            <TouchableOpacity
              onPress={onRequestPhoneVerify}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: theme.primary + "18",
                borderWidth: 1,
                borderColor: theme.primary + "44",
              }}
            >
              <Text style={{ color: theme.primary, fontWeight: "700", fontSize: 13 }}>
                {isPhoneVerified ? "Change" : "Verify"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {isPhoneVerified ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
            <Ionicons name="shield-checkmark" size={14} color="#16a34a" />
            <Text style={{ color: "#16a34a", fontSize: 12, fontWeight: "700" }}>
              Verified
            </Text>
          </View>
        ) : phoneChanged ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 }}>
            <Ionicons name="alert-circle" size={14} color="#ea580c" />
            <Text style={{ color: "#ea580c", fontSize: 12, fontWeight: "600" }}>
              Please verify this number before saving
            </Text>
          </View>
        ) : null}
        {errors.phone && (
          <Text style={styles.errorText}>{errors.phone.message}</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={[styles.editButtonText, { color: theme.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.editButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileEditForm;
