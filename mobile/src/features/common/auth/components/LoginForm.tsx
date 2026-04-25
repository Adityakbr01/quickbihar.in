import React, { useRef, useState } from "react";
import { View, TouchableOpacity, Text, TextInput as RNTextInput } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "@/src/theme/components/TextInput";
import { loginSchema, LoginFormData } from "../validation/auth.schema";
import { useLogin } from "../hooks/useAuth";
import { AuthFormProps } from "./auth.types";
import { styles } from "../styles/auth.style";

export const LoginForm: React.FC<AuthFormProps> = ({
  loading,
  setApiError,
  setApiSuccess,
  switchMode,
  setOtpEmail,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<RNTextInput>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate: login } = useLogin();

  const handleLogin = (data: LoginFormData) => {
    setApiError(null);
    setApiSuccess(null);
    login(data, {
      onError: (error: any) => {
        const msg = error.message || "Login failed.";
        if (msg.toLowerCase().includes("not verified") || msg.toLowerCase().includes("otp")) {
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

  return (
    <View style={[styles.form, loading && { opacity: 0.7 }]}>
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
            editable={!loading}
            error={errors.email?.message}
            icon={<Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" />}
          />
        )}
      />

      <View>
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
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, { marginTop: 20 }]}
        activeOpacity={0.85}
        onPress={handleSubmit(handleLogin)}
        disabled={loading}
      >
        <Text style={styles.continueBtnText}>
          Sign In <Ionicons name="arrow-forward-outline" size={20} color="#0f172a" />
        </Text>
      </TouchableOpacity>
    </View>
  );
};
