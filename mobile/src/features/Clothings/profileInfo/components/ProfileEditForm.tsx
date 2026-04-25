import React from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
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
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  control,
  errors,
  onSubmit,
  onCancel,
  isLoading,
  theme,
  styles,
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

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                errors.phone && { borderColor: theme.error },
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Phone Number"
              placeholderTextColor={theme.tertiaryText}
              keyboardType="phone-pad"
            />
          )}
        />
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
