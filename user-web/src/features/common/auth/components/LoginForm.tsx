import React, { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";

import { TextInput } from "@/src/theme/components/TextInput";
import { loginSchema, LoginFormData } from "../validation/auth.schema";
import { AuthFormProps } from "./auth.types";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

/**
 * Email + password sign-in. Google is the primary path; this is the
 * secondary path rendered below the Google button.
 */
export const LoginForm: React.FC<AuthFormProps & { login: any }> = ({
  loading,
  setApiError,
  setApiSuccess,
  login,
}) => {
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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
        setApiError(msg);
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
            icon={<Mail size={20} color={theme.secondaryText} />}
          />
        )}
      />

      <div className="mt-3">
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

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goTo(navigate, "/auth/forgot-password" as any);
          }}
          className="cursor-pointer text-[13px] font-semibold underline"
          style={{ color: theme.secondaryText }}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="button"
        className={cn(
          "flex h-[60px] cursor-pointer items-center justify-center rounded-[30px] text-lg font-bold transition-opacity disabled:cursor-not-allowed",
        )}
        style={{
          marginTop: 20,
          backgroundColor: theme.text,
          color: theme.background,
          opacity: loading ? 0.7 : 1,
        }}
        onClick={handleSubmit(handleLogin)}
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
            Sign In
          </span>
        )}
      </button>
    </div>
  );
};
