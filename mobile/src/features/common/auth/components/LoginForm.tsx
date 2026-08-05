import React, { useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput as RNTextInput,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { TextInput } from "@/src/theme/components/TextInput";
import { loginSchema, LoginFormData } from "../validation/auth.schema";
import { AuthFormProps } from "./auth.types";
import { createAuthStyles } from "../styles/auth.style";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useRequestOTP } from "../hooks/useAuth";

export const LoginForm: React.FC<AuthFormProps & { login: any }> = ({
  loading,
  setApiError,
  setApiSuccess,
  switchMode,
  setOtpEmail,
  login,
}) => {
  const theme = useTheme() as any;
  const styles = createAuthStyles(theme);
  const [tab, setTab] = useState<"otp" | "password">("otp");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<RNTextInput>(null);

  const { mutate: requestOTP, isPending: otpSending } = useRequestOTP();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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
      { target: cleaned, isRegistration: false },
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

  const handleLogin = (data: LoginFormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApiError(null);
    setApiSuccess(null);
    login(data, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError: (error: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const msg = error.message || "Login failed.";
        if (
          msg.toLowerCase().includes("not verified") ||
          msg.toLowerCase().includes("otp")
        ) {
          setOtpEmail(data.email);
          switchMode("otp");
          setApiError(null);
          setApiSuccess("An OTP has been sent to your email. Please verify.");
        } else {
          setApiError(msg);
        }
      },
    });
  };

  const isSubmitting = loading || otpSending;

  return (
    <View style={[styles.form, isSubmitting && { opacity: 0.7 }]}>
      {/* Mode Switcher Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: theme.cardBackground || "rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: 4,
          marginBottom: 20,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: "center",
            backgroundColor:
              tab === "otp"
                ? theme.primary
                : "transparent",
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab("otp");
            setApiError(null);
          }}
        >
          <Text
            style={{
              color: tab === "otp" ? "#ffffff" : theme.secondaryText,
              fontWeight: "600",
              fontSize: 13,
            }}
          >
            Mobile OTP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: "center",
            backgroundColor:
              tab === "password"
                ? theme.primary
                : "transparent",
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab("password");
            setApiError(null);
          }}
        >
          <Text
            style={{
              color: tab === "password" ? "#ffffff" : theme.secondaryText,
              fontWeight: "600",
              fontSize: 13,
            }}
          >
            Email & Password
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "otp" ? (
        /* Tab 1: Phone OTP (NO Password required) */
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
      ) : (
        /* Tab 2: Email & Password */
        <>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email Address"
                variant="glass"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                editable={!isSubmitting}
                error={errors.email?.message}
                icon={
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={theme.secondaryText}
                  />
                }
              />
            )}
          />

          <View style={{ marginTop: 12 }}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={passwordRef}
                  label="Password"
                  variant="glass"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(handleLogin)}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!isSubmitting}
                  error={errors.password?.message}
                  icon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={theme.secondaryText}
                    />
                  }
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPassword(!showPassword);
                      }}
                      style={{ padding: 4 }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={theme.secondaryText}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.continueBtn, { marginTop: 24 }]}
        activeOpacity={0.85}
        onPress={tab === "otp" ? handleSendOtp : handleSubmit(handleLogin)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#0f172a" size="small" />
        ) : (
          <Text style={styles.continueBtnText}>
            {tab === "otp" ? "Get OTP →" : "Sign In"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
