import * as z from "zod";

/**
 * Email + password sign-in (admin, seller, delivery).
 * Phone is no longer accepted as an identifier — Google is primary, email/pw secondary.
 */
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

export type LoginValues = z.infer<typeof loginSchema>;

/**
 * Partner (seller / rider) self-registration.
 * Phase A: Phases 1 (mobile OTP) and 2 (OTP verify) are removed.
 * Phase 3: email + password + fullName, identity later linked to the role by admin approval.
 */
export const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." }),
});

export type RegisterValues = z.infer<typeof registerSchema>;

/**
 * Google OAuth — only the idToken is needed; the server determines whether the
 * account is new or existing based on the verified email.
 */
export const googleAuthSchema = z.object({
  idToken: z.string().min(10, { message: "Google ID token is required." }),
  legacyPhone: z
    .string()
    .regex(/^\d{10}$/, { message: "Phone must be 10 digits." })
    .optional(),
});
export type GoogleAuthValues = z.infer<typeof googleAuthSchema>;

/**
 * Set or update the password on the currently authenticated account.
 * Used by Google-only users who want a backup sign-in method.
 */
export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string()
      .min(8, { message: "Confirm password is required." }),
    currentPassword: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type SetPasswordValues = z.infer<typeof setPasswordSchema>;

/**
 * Link an existing Google account to the current password account.
 */
export const linkGoogleSchema = z.object({
  idToken: z.string().min(10),
});
export type LinkGoogleValues = z.infer<typeof linkGoogleSchema>;

/**
 * Password reset — request (always returns 200) and consume a reset token.
 */
export const requestResetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});
export type RequestResetValues = z.infer<typeof requestResetSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, { message: "Reset link is invalid." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string()
      .min(8, { message: "Confirm password is required." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/**
 * Optional profile fields the user can update without touching auth.
 */
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  fullName: string;
  role:
    | "ADMIN"
    | "SUPER_ADMIN"
    | "SELLER"
    | "DELIVERY"
    | "USER"
    | null
    | {
        _id: string;
        name: "ADMIN" | "SUPER_ADMIN" | "SELLER" | "DELIVERY" | "USER";
        description?: string;
      };
}

export interface AuthResponse {
  statusCode: number;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  };
  message: string;
}

export interface PasswordResetResponse {
  statusCode: number;
  data: {
    message: string;
  };
  message: string;
}
