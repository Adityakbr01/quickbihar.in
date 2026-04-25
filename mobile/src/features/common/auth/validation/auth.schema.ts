import { z } from "zod";

// ─── LOGIN SCHEMA ────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── REGISTER SCHEMA ────────────────────────────────────
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── OTP SCHEMA ──────────────────────────────────────────
export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits"),
});

export type OTPFormData = z.infer<typeof otpSchema>;

// Legacy export for backward compat
export const authSchema = loginSchema;
export type AuthFormData = LoginFormData;
