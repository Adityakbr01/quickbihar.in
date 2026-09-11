/**
 * PhoneOtpSheet — 2-step WhatsApp OTP verification bottom sheet.
 *
 * Step 1: User enters phone → sends OTP via /auth/verify-phone/send
 * Step 2: User enters 6-digit OTP → confirms via /auth/verify-phone/confirm
 *
 * On success: calls onVerified(phone) so parent can pre-fill and badge the field.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { sendPhoneOtpRequest, verifyPhoneOtpRequest } from "../api/address.api";
import { createAddressStyles } from "../style/addressStyles";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";


interface PhoneOtpSheetProps {
  visible: boolean;
  /** Pre-fill the phone input with this value if provided */
  initialPhone?: string;
  onVerified: (phone: string) => void;
  onClose: () => void;
}

const PhoneOtpSheet: React.FC<PhoneOtpSheetProps> = ({
  visible,
  initialPhone = "",
  onVerified,
  onClose,
}) => {
  const theme = useTheme();
  const styles = createAddressStyles(theme);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const otpInputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setStep("phone");
      setPhone(initialPhone);
      setOtp("");
      setError(null);
      setCountdown(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    const cleaned = phone.trim().replace(/\D/g, "");
    if (cleaned.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPhoneOtpRequest(cleaned);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("otp");
      setCountdown(60);
      // Focus OTP input after transition
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to send OTP.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const cleaned = phone.trim().replace(/\D/g, "");
      await verifyPhoneOtpRequest(cleaned, otp.trim());
      await useAuthStore.getState().updateUser({ phone: cleaned, isPhoneVerified: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onVerified(cleaned);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Invalid or incorrect OTP. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setOtp("");
    setError(null);
    setLoading(true);
    try {
      const cleaned = phone.trim().replace(/\D/g, "");
      await sendPhoneOtpRequest(cleaned);
      setCountdown(60);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Split OTP string into 6 display slots
  const otpDigits = otp.padEnd(6, " ").split("");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.otpOverlay}
      >
        {/* Backdrop tap to close */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[styles.otpSheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {step === "phone" ? (
            <>
              <Text style={styles.otpSheetTitle}>Verify Your Number</Text>
              <Text style={styles.otpSheetSubtitle}>
                We'll send a 6-digit OTP to your WhatsApp
              </Text>

              {/* Phone input reusing existing input style */}
              <TextInput
                style={[styles.input, error ? { borderColor: "#FF3B30" } : {}]}
                placeholder="e.g. 9876543210"
                placeholderTextColor={theme.tertiaryText}
                keyboardType="phone-pad"
                maxLength={15}
                value={phone}
                onChangeText={(v) => {
                  setPhone(v);
                  setError(null);
                }}
                autoFocus
                returnKeyType="send"
                onSubmitEditing={handleSendOtp}
              />

              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              <TouchableOpacity
                style={styles.otpPrimaryButton}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.otpPrimaryButtonText}>Send OTP on WhatsApp</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.otpSecondaryButton} onPress={onClose}>
                <Text style={styles.otpSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.otpSheetTitle}>Enter OTP</Text>
              <Text style={styles.otpSheetSubtitle}>
                Sent to WhatsApp +{phone.replace(/\D/g, "")}
              </Text>

              {/* 6-slot visual OTP display + hidden real input */}
              <View>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => otpInputRef.current?.focus()}
                  style={styles.otpDigitRow}
                >
                  {otpDigits.map((d, i) => (
                    <View
                      key={i}
                      style={[
                        styles.otpDigitBox,
                        d.trim() ? styles.otpDigitBoxFilled : {},
                      ]}
                    >
                      <Text style={styles.otpDigitText}>
                        {d.trim() || ""}
                      </Text>
                    </View>
                  ))}
                </TouchableOpacity>

                {/* Hidden real text input */}
                <TextInput
                  ref={otpInputRef}
                  style={styles.otpHiddenInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(v) => {
                    setOtp(v.replace(/\D/g, ""));
                    setError(null);
                  }}
                  caretHidden
                />
              </View>

              {error && (
                <Text style={[styles.errorText, { textAlign: "center" }]}>{error}</Text>
              )}

              {/* Resend countdown */}
              <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't receive it? </Text>
                <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || loading}>
                  <Text style={[styles.resendLink, countdown > 0 ? { opacity: 0.4 } : {}]}>
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.otpPrimaryButton}
                onPress={handleVerifyOtp}
                disabled={loading || otp.length < 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.otpPrimaryButtonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.otpSecondaryButton}
                onPress={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
              >
                <Text style={styles.otpSecondaryButtonText}>← Change Number</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PhoneOtpSheet;
