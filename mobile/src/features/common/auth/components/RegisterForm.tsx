import React, { useRef, useState } from "react";
import { View, TouchableOpacity, Text, TextInput as RNTextInput, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { TextInput } from "@/src/theme/components/TextInput";
import { registerSchema, RegisterFormData } from "../validation/auth.schema";
import { AuthFormProps } from "./auth.types";
import { createAuthStyles } from "../styles/auth.style";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

export const RegisterForm: React.FC<AuthFormProps & { register: any }> = ({
  loading,
  setApiError,
  setApiSuccess,
  switchMode,
  setOtpEmail,
  register,
}) => {
  const theme = useTheme() as any;
  const styles = createAuthStyles(theme);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const handleRegister = (data: RegisterFormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApiError(null);
    setApiSuccess(null);
    register(data, {
      onSuccess: (response) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOtpEmail(data.email);
        switchMode("otp");
        setApiError(null);
        setApiSuccess(
          response?.data?.message || "Registration successful! Check your email for OTP."
        );
      },
      onError: (error: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setApiError(error.message || "Registration failed.");
      },
    });
  };

  return (
    <View style={[styles.form, loading && { opacity: 0.7 }]}>
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Full Name"
            variant="glass"
            placeholder="John Doe"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            editable={!loading}
            error={errors.fullName?.message}
            icon={<Ionicons name="person-outline" size={20} color={theme.secondaryText} />}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            ref={emailRef}
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
            editable={!loading}
            error={errors.email?.message}
            icon={<Ionicons name="mail-outline" size={20} color={theme.secondaryText} />}
          />
        )}
      />

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
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(handleRegister)}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            editable={!loading}
            error={errors.password?.message}
            icon={<Ionicons name="lock-closed-outline" size={20} color={theme.secondaryText} />}
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

      <TouchableOpacity
        style={[styles.continueBtn, { marginTop: 20 }]}
        activeOpacity={0.85}
        onPress={handleSubmit(handleRegister)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0f172a" size="small" />
        ) : (
          <Text style={styles.continueBtnText}>Create Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
