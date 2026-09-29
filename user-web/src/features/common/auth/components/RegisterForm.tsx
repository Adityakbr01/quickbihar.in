import React, { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import * as Haptics from "@/lib/haptics";

import { TextInput } from "@/src/theme/components/TextInput";
import {
  registerSchema,
  RegisterFormData,
} from "../validation/auth.schema";
import { AuthFormProps } from "./auth.types";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

/**
 * Email + password registration. Sends fullName + email + password
 * to /auth/register; the server creates an ACTIVE user (no
 * approval state for normal customers) and returns tokens.
 */
export const RegisterForm: React.FC<AuthFormProps & { register: any }> = ({
  loading,
  setApiError,
  setApiSuccess,
  register,
}) => {
  const theme = useTheme() as any;
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const handleRegister = (data: RegisterFormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApiError(null);
    setApiSuccess(null);
    register(data, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setApiError(err?.message || "Registration failed.");
      },
    });
  };

  return (
    <div
      className="mb-10 flex flex-col gap-5"
      style={loading ? { opacity: 0.7 } : undefined}
    >
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Full Name"
            variant="glass"
            placeholder="Your name"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            editable={!loading}
            error={errors.fullName?.message}
            icon={<User size={20} color={theme.secondaryText} />}
          />
        )}
      />

      <div className="mt-3">
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
              icon={<Mail size={20} color={theme.secondaryText} />}
            />
          )}
        />
      </div>

      <div className="mt-3">
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              ref={passwordRef}
              label="Password"
              variant="glass"
              placeholder="At least 8 characters"
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(handleRegister)}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              editable={!loading}
              error={errors.password?.message}
              icon={<Lock size={20} color={theme.secondaryText} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPassword(!showPassword);
                  }}
                  className="cursor-pointer p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.secondaryText} />
                  ) : (
                    <Eye size={20} color={theme.secondaryText} />
                  )}
                </button>
              }
            />
          )}
        />
      </div>

      <button
        type="button"
        className={cn(
          "flex h-[60px] cursor-pointer items-center justify-center rounded-[30px] text-lg font-bold transition-opacity disabled:cursor-not-allowed",
        )}
        style={{
          marginTop: 24,
          backgroundColor: theme.text,
          color: theme.background,
          opacity: loading ? 0.7 : 1,
        }}
        onClick={handleSubmit(handleRegister)}
        disabled={loading}
      >
        {loading ? (
          <span
            className="h-5 w-5 animate-spin rounded-full border-2"
            style={{ borderColor: "#0f172a", borderTopColor: "transparent" }}
          />
        ) : (
          <span
            className="text-center text-lg font-bold"
            style={{ color: theme.background }}
          >
            Create Account
          </span>
        )}
      </button>
    </div>
  );
};
