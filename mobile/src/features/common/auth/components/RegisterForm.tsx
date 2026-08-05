import React, { useState } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { TextInput } from "@/src/theme/components/TextInput";
import { AuthFormProps } from "./auth.types";
import { createAuthStyles } from "../styles/auth.style";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useRequestOTP } from "../hooks/useAuth";

export const RegisterForm: React.FC<AuthFormProps & { register: any }> = ({
  loading,
  setApiError,
  setApiSuccess,
  switchMode,
  setOtpEmail,
}) => {
  const theme = useTheme() as any;
  const styles = createAuthStyles(theme);
  const [phone, setPhone] = useState("");

  const { mutate: requestOTP, isPending: otpSending } = useRequestOTP();

  const handleSendOtp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApiError(null);
    setApiSuccess(null);
    const cleaned = phone.trim();

    if (cleaned.length !== 10) {
      setApiError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setOtpEmail(cleaned);
    requestOTP(
      { target: cleaned, isRegistration: true },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setApiSuccess("OTP code generated and sent successfully!");
          switchMode("otp");
        },
        onError: (err: any) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setApiError(err.message || "Failed to send OTP.");
        },
      }
    );
  };

  const isSubmitting = loading || otpSending;

  return (
    <View style={[styles.form, isSubmitting && { opacity: 0.7 }]}>
      <TextInput
        label="Mobile Number"
        variant="glass"
        placeholder="Enter 10-digit number"
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={setPhone}
        editable={!isSubmitting}
        icon={
          <Ionicons
            name="call-outline"
            size={20}
            color={theme.secondaryText}
          />
        }
      />

      <TouchableOpacity
        style={[styles.continueBtn, { marginTop: 20 }]}
        activeOpacity={0.85}
        onPress={handleSendOtp}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#0f172a" size="small" />
        ) : (
          <Text style={styles.continueBtnText}>Get OTP →</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
