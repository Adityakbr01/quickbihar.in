import { z } from "zod";

/**
 * Auth validation — post-OTP cutover.
 *
 *   • /auth/login        → email + password
 *   • /auth/register     → email + password + fullName + phone
 *   • /auth/google       → Google idToken (+ optional client)
 *   • /auth/set-password → password (authenticated)
 *   • /auth/link-google  → Google idToken (authenticated)
 *   • /auth/request-reset → email
 *   • /auth/reset-password → reset JWT + new password
 *
 * Phone is part of the register payload for seller/rider sign-up so we can
 * (a) verify the applicant's identity up-front and (b) keep the rider
 * eligibility check (`riderProfileMissingFields`) satisfied without forcing
 * the user to fill in profile details after the fact. Customers signing up
 * for plain shopping still provide phone — it's the same one field, no
 * branching on the schema.
 */

const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+?\d{10,15}$/,
    "Phone number must be 10 to 15 digits (optionally prefixed with +)",
  );

export const authenticateSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: phoneSchema,
});

// ── Google OAuth + password reset schemas ─────────────────

export const googleAuthSchema = z.object({
  idToken: z.string().min(10, "Google ID token is required"),
  client: z.enum(["web", "mobile"]).default("web"),
  // Optional phone from a legacy OTP-only user. Server uses this
  // to detect same-person identity and merge records on first
  // Google sign-in. Ignored for normal users.
  legacyPhone: z.string().optional(),
});

export const setPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Required when the user already has a password identity;
  // server enforces this when identities[] already contains
  // a "password" entry.
  currentPassword: z.string().optional(),
});

export const linkGoogleSchema = z.object({
  idToken: z.string().min(10, "Google ID token is required"),
});

export const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AuthenticateBody = z.infer<typeof authenticateSchema>;
export type RegisterBody = z.infer<typeof registerSchema>;
export type GoogleAuthBody = z.infer<typeof googleAuthSchema>;
export type SetPasswordBody = z.infer<typeof setPasswordSchema>;
export type LinkGoogleBody = z.infer<typeof linkGoogleSchema>;
export type RequestResetBody = z.infer<typeof requestResetSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
