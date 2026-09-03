import { z } from "zod";

// ─── LOGIN SCHEMA ────────────────────────────────────────
// Email + password (Google sign-in is its own flow, no schema needed)
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── REGISTER SCHEMA ────────────────────────────────────
// Mirrors the server's hardened registerSchema (8-char min, name required).
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
    .min(8, "Password must be at least 8 characters"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── SET PASSWORD (authenticated user, no current password) ─
export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long (max 72 characters)"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

// ─── FORGOT PASSWORD (just an email) ────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── RESET PASSWORD (from email link) ───────────────────
// `token` arrives as a query param from the email deep link, so
// only password + confirm are validated client-side.
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long (max 72 characters)"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── LEGACY EMAIL CAPTURE (forced upgrade for OTP users) ─
// Replaces the synthetic `^\d{10}@quickbihar\.local$` email with a
// real one. The password is set in the same step so the user can
// later use the email+password login (or continue with Google if
// they link it).
export const legacyEmailCaptureSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LegacyEmailCaptureFormData = z.infer<typeof legacyEmailCaptureSchema>;

// Legacy export for backward compat
export const authSchema = loginSchema;
export type AuthFormData = LoginFormData;
