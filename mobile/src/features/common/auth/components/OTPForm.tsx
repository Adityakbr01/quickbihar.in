import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { TextInput } from "@/src/theme/components/TextInput";
import { useRequestOTP } from "../hooks/useAuth";
import { AuthFormProps } from "./auth.types";
import { createAuthStyles } from "../styles/auth.style";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

interface OTPFormProps extends AuthFormProps {
  otpEmail: string;
}

export const OTPForm: React.FC<OTPFormProps & { verifyOTP: any }> = ({
  loading,
  setApiError,
  setApiSuccess,
  otpEmail,
  verifyOTP,
}) => {
  const theme = useTheme() as any;
  const styles = createAuthStyles(theme);
  const [otpValue, setOtpValue] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const { mutate: requestOTP } = useRequestOTP();

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const handleVerifyOTP = () => {
    if (otpValue.length !== 6) {
      setApiError("Please enter a valid 6-digit OTP");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApiError(null);
    setApiSuccess(null);
    verifyOTP(
      { email: otpEmail, otp: otpValue },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (error: any) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setApiError(error.message || "OTP verification failed.");
        },
      }
    );
  };

  const handleResendOTP = () => {
    if (cooldown > 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setApiError(null);
    setApiSuccess(null);
    requestOTP(otpEmail, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setApiSuccess("A new OTP has been sent to your email.");
        setCooldown(60); // Start 60s cooldown
      },
      onError: (error: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const msg = error.message || "Failed to resend OTP.";
        setApiError(msg);
        if (msg.toLowerCase().includes("wait") || msg.toLowerCase().includes("seconds")) {
          // Extract seconds if possible, or just default to 60
          setCooldown(60);
        }
      },
    });
  };

  return (
    <View style={[styles.form, loading && { opacity: 0.7 }]}>
      <TextInput
        label="Verification Code"
        variant="glass"
        placeholder="Enter 6-digit OTP"
        keyboardType="number-pad"
        maxLength={6}
        value={otpValue}
        onChangeText={setOtpValue}
        editable={!loading}
        returnKeyType="done"
        onSubmitEditing={handleVerifyOTP}
        icon={<Ionicons name="shield-checkmark-outline" size={20} color={theme.secondaryText} />}
      />

      <TouchableOpacity
        style={[styles.continueBtn, { marginTop: 10 }]}
        activeOpacity={0.85}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0f172a" size="small" />
        ) : (
          <Text style={styles.continueBtnText}>Verify & Continue</Text>
        )}
      </TouchableOpacity>

      <View style={{ marginTop: 20, alignItems: "center" }}>
        <TouchableOpacity
          onPress={handleResendOTP}
          disabled={cooldown > 0 || loading}
        >
          <Text
            style={{
              color: cooldown > 0 ? theme.tertiaryText : theme.text,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {cooldown > 0
              ? `Resend OTP in ${cooldown}s`
              : "Didn't receive code? Resend OTP"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
