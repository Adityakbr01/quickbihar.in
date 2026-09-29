import React, { useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import * as Haptics from "@/lib/haptics";

import { useModuleTheme, type ModuleVariant } from "@/src/theme/useModuleTheme";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import axiosInstance from "@/src/api/axiosInstance";
import { useAccountStore } from "../store/accountStore";
import { TextInput } from "@/src/theme/components/TextInput";
import { AppSheet } from "@/src/components/common/AppSheet";

/**
 * Bottom sheet version of the "Password & Email Setup" form.
 *
 * Opened from the account screen via `useAccountStore().setPasswordSheetVisible(true)`.
 * Mounted once at the top level of the account screen so the sheet's
 * visibility flag is stable across open/close cycles.
 *
 * Design notes (per UX review):
 *  • No field-card backgrounds — keep the sheet airy and minimal.
 *  • Inputs use the theme's `secondaryBackground` so they read as a
 *    subtle surface in BOTH light and dark mode (no hard-coded white).
 *  • The close button is intentionally omitted from the header — users
 *    can still dismiss via the backdrop tap or system back.
 *  • The primary CTA uses WHITE text on the brand primary colour. The
 *    brand primary is a bright lime-green; dark text on it fails
 *    contrast and looks like an inverted button.
 *  • The email field is pre-filled with the logged-in account's email and is
 *    READ-ONLY — only the password is editable here. The single exception is
 *    legacy OTP accounts carrying a synthetic `<phone>@quickbihar.local`
 *    email (or no email at all): they must type a real address once, so the
 *    field stays editable until a real email is saved.
 */
const PasswordEmailSetupSheet = ({ variant = "default" }: { variant?: ModuleVariant } = {}) => {
  // In the jewelery account tab the same sheet renders in the jewellery
  // palette (ivory/gold) via the module theme — all logic stays identical.
  const theme = useModuleTheme(variant);
  const { user, token, refreshToken, setAuth } = useAuthStore();
  const isVisible = useAccountStore((state) => state.isPasswordSheetVisible);
  const setVisible = useAccountStore((state) => state.setPasswordSheetVisible);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const confirmRef = useRef<any>(null);

  // Reset fields whenever the sheet is (re-)opened so a previous half-filled
  // form never leaks into the next open — but pre-fill the logged-in
  // account's email (still editable). Synthetic legacy-OTP emails
  // (`<phone>@quickbihar.local`) are skipped so the user types a real one.
  useEffect(() => {
    if (isVisible) {
      const current = typeof user?.email === "string" ? user.email.trim() : "";
      const isSynthetic = /^\d{10}@quickbihar\.local$/i.test(current);
      setEmail(isSynthetic ? "" : current);
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirm(false);
      setError("");
      setSuccess(false);
    }
  }, [isVisible, user?.email]);

  const validate = () => {
    if (!email.trim() || !email.includes("@")) {
      setError(
        "Please add your email address (e.g. name@example.com) for password login.",
      );
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColor = [
    "",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#10b981",
  ];

  const handleSubmit = async () => {
    setError("");
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const payload: any = { password, email: email.trim() };

      const response = await axiosInstance.patch("/users/profile", payload);
      setLoading(false);

      if (response?.data?.statusCode === 200 || response?.status === 200) {
        if (response.data?.data) {
          await setAuth(response.data.data, token || "", refreshToken || "");
        }
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          setVisible(false);
        }, 1500);
      } else {
        setError(response?.data?.message || "Could not update security profile.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setLoading(false);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update security profile.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const strength = getStrength();

  // Email is locked: users may only set a password here. Exception — legacy
  // OTP accounts with a synthetic `<phone>@quickbihar.local` email (or no
  // email) must enter a real address once, so it stays editable for them.
  const storedEmail = typeof user?.email === "string" ? user.email.trim() : "";
  const hasRealEmail =
    storedEmail !== "" && !/^\d{10}@quickbihar\.local$/i.test(storedEmail);
  const isEmailLocked = hasRealEmail;

  // Theme tokens (re-derived so they're obvious in the JSX below)
  const inputBg = theme.secondaryBackground; // subtle surface, works in both modes
  const inputText = theme.text;
  const inputPlaceholder = theme.tertiaryText; // muted so it never competes with real text

  return (
    <AppSheet
      visible={isVisible}
      onClose={() => setVisible(false)}
      title="Password & Email Setup"
      subtitle="Link your email and set a secure password for password login."
      label="Password and Email Setup"
      footer={
        success ? null : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex w-full flex-row items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-extrabold tracking-[0.4px] text-white transition active:opacity-85 disabled:opacity-70"
            style={{
              backgroundColor: theme.primary,
              borderRadius: theme.radius ?? 16,
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
            }}
          >
            {loading ? (
              <span
                role="status"
                aria-label="Saving"
                className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
            ) : (
              <>
                <ShieldCheck size={18} color="#fff" />
                <span>Save Password &amp; Email</span>
              </>
            )}
          </button>
        )
      }
    >
      <div className="flex flex-col px-4 pb-4">
          {success ? (
            <div
              className="mt-2 flex flex-col items-center rounded-[20px] border p-7 text-center"
              style={{
                backgroundColor: theme.tertiaryBackground,
                borderColor: theme.border,
              }}
            >
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
              >
                <CircleCheck size={48} color="#22c55e" />
              </div>
              <p
                className="mt-4 text-center text-lg font-extrabold"
                style={{ color: theme.text }}
              >
                Security Updated!
              </p>
              <p
                className="mt-2 text-center text-[13px] leading-[18px]"
                style={{ color: theme.secondaryText }}
              >
                Your email and password are saved. Closing…
              </p>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {error ? (
                <div
                  className="mb-3.5 flex flex-row items-center gap-2 rounded-xl border p-3"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    borderRadius: theme.radius ?? 12,
                  }}
                >
                  <CircleAlert size={18} color="#fca5a5" />
                  <p
                    className="flex-1 text-[13px] font-semibold leading-[18px]"
                    style={{ color: "#fca5a5" }}
                  >
                    {error}
                  </p>
                </div>
              ) : null}

              {/* ── Field: Email ─────────────────────────────────────── */}
              <div className="mb-[18px]">
                <p
                  className="mb-2 text-[13px] font-bold tracking-[0.3px]"
                  style={{ color: theme.text }}
                >
                  Email Address
                </p>
                <TextInput placeholder="Please add your email"
                  placeholderTextColor={inputPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  editable={!isEmailLocked}
                  selectTextOnFocus={!isEmailLocked}
                  icon={
                    <Mail size={18} color={theme.secondaryText} />
                  }
                  rightIcon={
                    isEmailLocked ? (
                      <Lock size={16} color={theme.secondaryText} />
                    ) : undefined
                  }
                  containerStyle={{ marginBottom: 0, opacity: isEmailLocked ? 0.6 : 1 }}
                  inputContainerStyle={{
                    backgroundColor: inputBg,
                    borderRadius: theme.radius ?? 14,
                    height: 52,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                  }}
                  style={{ fontSize: 15, fontWeight: "600", color: inputText }}
                />
                {isEmailLocked ? (
                  <p
                    className="mt-1.5 text-xs"
                    style={{ color: theme.tertiaryText }}
                  >
                    Email is linked to your account and can&apos;t be changed
                    here.
                  </p>
                ) : null}
              </div>

              {/* ── Field: New Password ──────────────────────────────── */}
              <div className="mb-[18px]">
                <p
                  className="mb-2 text-[13px] font-bold tracking-[0.3px]"
                  style={{ color: theme.text }}
                >
                  New Password
                </p>
                <TextInput placeholder="At least 6 characters"
                  placeholderTextColor={inputPlaceholder}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  returnKeyType="next"
                  icon={
                    <Lock size={18} color={theme.secondaryText} />
                  }
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPassword(!showPassword);
                      }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center"
                    >
                      {showPassword ? (
                      <EyeOff size={20} color={theme.secondaryText} />
                    ) : (
                      <Eye size={20} color={theme.secondaryText} />
                    )}
                    </button>
                  }
                  containerStyle={{ marginBottom: 0 }}
                  inputContainerStyle={{
                    backgroundColor: inputBg,
                    borderRadius: theme.radius ?? 14,
                    height: 52,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                  }}
                  style={{ fontSize: 15, fontWeight: "600", color: inputText }}
                />
                {password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex h-1 flex-row gap-1.5">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div key={idx}
                          className="flex-1 rounded-sm"
                          style={{
                            backgroundColor:
                              idx <= strength
                                ? strengthColor[strength]
                                : theme.border,
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="mt-1.5 text-xs font-bold tracking-[0.2px]"
                      style={{ color: strengthColor[strength] }}
                    >
                      {strengthLabel[strength]}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Field: Confirm Password ──────────────────────────── */}
              <div className="mb-[18px]">
                <p
                  className="mb-2 text-[13px] font-bold tracking-[0.3px]"
                  style={{ color: theme.text }}
                >
                  Confirm Password
                </p>
                <TextInput ref={confirmRef}
                  placeholder="Re-enter password"
                  placeholderTextColor={inputPlaceholder}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="done"
                  icon={
                    <ShieldCheck size={18} color={theme.secondaryText} />
                  }
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowConfirm(!showConfirm);
                      }}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center"
                    >
                      {showConfirm ? (
                      <EyeOff size={20} color={theme.secondaryText} />
                    ) : (
                      <Eye size={20} color={theme.secondaryText} />
                    )}
                    </button>
                  }
                  containerStyle={{ marginBottom: 0 }}
                  inputContainerStyle={{
                    backgroundColor: inputBg,
                    borderRadius: theme.radius ?? 14,
                    height: 52,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                  }}
                  style={{ fontSize: 15, fontWeight: "600", color: inputText }}
                />
              </div>
            </>
          )}
      </div>
    </AppSheet>
  );
};

export default PasswordEmailSetupSheet;
