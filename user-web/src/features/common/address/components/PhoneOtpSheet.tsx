/**
 * PhoneOtpSheet — 2-step WhatsApp OTP verification bottom sheet.
 *
 * Step 1: User enters phone → sends OTP via /auth/verify-phone/send
 * Step 2: User enters 6-digit OTP → confirms via /auth/verify-phone/confirm
 *
 * On success: calls onVerified(phone) so parent can pre-fill and badge the field.
 */
import React, { useEffect, useRef, useState } from "react";
import * as Haptics from "@/lib/haptics";
import { sendPhoneOtpRequest, verifyPhoneOtpRequest } from "../api/address.api";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { TextInput } from "@/src/theme/components/TextInput";
import { cn } from "@/src/lib/utils";
import { AppSheet } from "@/src/components/common/AppSheet";


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
  const theme = useTheme() as any;

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setStep("phone");
      setPhone(initialPhone);
      setOtp("");
      setError(null);
      setCountdown(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const sheetTitle = step === "phone" ? "Verify Your Number" : "Enter OTP";
  const sheetSubtitle =
    step === "phone"
      ? "We'll send a 6-digit OTP to your WhatsApp"
      : `Sent to WhatsApp +${phone.replace(/\D/g, "")}`;

  return (
    <AppSheet
      visible={visible}
      onClose={onClose}
      title={sheetTitle}
      subtitle={sheetSubtitle}
      label="Verify phone number"
      footer={
        step === "phone" ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="flex h-[54px] w-full cursor-pointer items-center justify-center rounded-2xl shadow-md disabled:opacity-60"
              style={{ backgroundColor: theme.primary }}
            >
              {loading ? (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                />
              ) : (
                <span className="text-base font-bold text-white">
                  Send OTP on WhatsApp
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 cursor-pointer items-center justify-center"
            >
              <span
                className="text-sm font-medium"
                style={{ color: theme.secondaryText }}
              >
                Cancel
              </span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="flex h-[54px] w-full cursor-pointer items-center justify-center rounded-2xl shadow-md disabled:opacity-60"
              style={{ backgroundColor: theme.primary }}
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <span className="text-base font-bold text-white">Verify</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
              className="flex h-11 cursor-pointer items-center justify-center"
            >
              <span
                className="text-sm font-medium"
                style={{ color: theme.secondaryText }}
              >
                ← Change Number
              </span>
            </button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-4 px-4 pb-4">
        {step === "phone" ? (
          <>
            {/* Phone input */}
            <TextInput
              placeholder="e.g. 9876543210"
              placeholderTextColor={theme.tertiaryText}
              keyboardType="phone-pad"
              maxLength={15}
              value={phone}
              onChangeText={(v: string) => {
                setPhone(v);
                setError(null);
              }}
              autoFocus
              returnKeyType="send"
              onSubmitEditing={handleSendOtp}
              error={error ?? undefined}
              icon={
                <span style={{ color: theme.secondaryText, fontWeight: "600" }}>
                  +91
                </span>
              }
              containerStyle={{ marginBottom: 0 }}
              style={{ color: theme.text }}
            />
          </>
        ) : (
          <>
            {/* 6-slot visual OTP display + hidden real input */}
            <div className="relative">
              <button
                type="button"
                onClick={() => otpInputRef.current?.focus()}
                className="flex w-full cursor-text flex-row justify-between gap-2"
                aria-label="Enter OTP"
              >
                {otpDigits.map((d, i) => (
                  <span
                    key={i}
                    className={cn("flex h-14 flex-1 items-center justify-center rounded-[14px] border-[1.5px]")}
                    style={{
                      borderColor: d.trim() ? theme.primary : theme.border,
                      backgroundColor: d.trim()
                        ? "rgba(0, 122, 255, 0.06)"
                        : theme.tertiaryBackground,
                    }}
                  >
                    <span
                      className="text-[22px] font-bold"
                      style={{ color: theme.text }}
                    >
                      {d.trim() || ""}
                    </span>
                  </span>
                ))}
              </button>

              {/* Hidden real text input (invisible 6-digit capture) */}
              <input
                ref={otpInputRef}
                className="absolute h-px w-px opacity-0"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerifyOtp();
                }}
                aria-label="6-digit OTP"
              />
            </div>

            {error && (
              <p className="text-center text-xs" style={{ color: theme.error }}>
                {error}
              </p>
            )}

            {/* Resend countdown */}
            <div className="flex flex-row items-center justify-center gap-1">
              <span className="text-[13px]" style={{ color: theme.secondaryText }}>
                Didn&apos;t receive it?{" "}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="cursor-pointer disabled:opacity-40"
              >
                <span
                  className="text-[13px] font-bold"
                  style={{ color: theme.primary, opacity: countdown > 0 ? 0.4 : 1 }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </AppSheet>
  );
};

export default PhoneOtpSheet;
