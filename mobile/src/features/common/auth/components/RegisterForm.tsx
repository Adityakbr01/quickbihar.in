import React, { useRef, useState } from "react";
import { View, TouchableOpacity, Text, TextInput as RNTextInput } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "@/src/theme/components/TextInput";
import { registerSchema, RegisterFormData } from "../validation/auth.schema";
import { useRegister } from "../hooks/useAuth";
import { AuthFormProps } from "./auth.types";
import { styles } from "../styles/auth.style";

export const RegisterForm: React.FC<AuthFormProps> = ({
  loading,
  setApiError,
  setApiSuccess,
  switchMode,
  setOtpEmail,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const { mutate: register } = useRegister();

  const handleRegister = (data: RegisterFormData) => {
    setApiError(null);
    setApiSuccess(null);
    register(data, {
      onSuccess: (response) => {
        setOtpEmail(data.email);
        switchMode("otp");
        setApiError(null);
        setApiSuccess(
          response?.data?.message || "Registration successful! Check your email for OTP."
        );
      },
      onError: (error: any) => {
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
            icon={<Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" />}
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
            icon={<Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" />}
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
            icon={<Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="rgba(255,255,255,0.6)"
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
        <Text style={styles.continueBtnText}>
          Create Account <Ionicons name="arrow-forward-outline" size={20} color="#0f172a" />
        </Text>
      </TouchableOpacity>
    </View>
  );
};
