import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "@/src/theme/components/TextInput";
import { useVerifyOTP, useRequestOTP } from "../hooks/useAuth";
import { AuthFormProps } from "./auth.types";
import { styles } from "../styles/auth.style";

interface OTPFormProps extends AuthFormProps {
  otpEmail: string;
}

export const OTPForm: React.FC<OTPFormProps> = ({
  loading,
  setApiError,
  setApiSuccess,
  otpEmail,
}) => {
  const [otpValue, setOtpValue] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const { mutate: verifyOTP } = useVerifyOTP();
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
      return;
    }
    setApiError(null);
    setApiSuccess(null);
    verifyOTP(
      { email: otpEmail, otp: otpValue },
      {
        onError: (error: any) => {
          setApiError(error.message || "OTP verification failed.");
        },
      }
    );
  };

  const handleResendOTP = () => {
    if (cooldown > 0) return;

    setApiError(null);
    setApiSuccess(null);
    requestOTP(otpEmail, {
      onSuccess: () => {
        setApiSuccess("A new OTP has been sent to your email.");
        setCooldown(60); // Start 60s cooldown
      },
      onError: (error: any) => {
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
        icon={<Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.7)" />}
      />

      <TouchableOpacity
        style={[styles.continueBtn, { marginTop: 10 }]}
        activeOpacity={0.85}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <Text style={styles.continueBtnText}>
          Verify & Continue <Ionicons name="arrow-forward-outline" size={20} color="#0f172a" />
        </Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20, alignItems: "center" }}>
        <TouchableOpacity
          onPress={handleResendOTP}
          disabled={cooldown > 0 || loading}
        >
          <Text
            style={{
              color: cooldown > 0 ? "rgba(255,255,255,0.4)" : "#ffffff",
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
