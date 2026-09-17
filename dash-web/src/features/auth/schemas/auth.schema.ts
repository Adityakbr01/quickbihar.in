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
 * Self-registration. Optional `role` hint controls the phone contract:
 *   • USER     → phone optional (default — customer sign-up)
 *   • SELLER   → phone required (admin verification)
 *   • RIDER    → phone required (admin verification)
 *
 * The mobile customer register uses role USER (phone optional). Web
 * partner onboarding uses Google authentication and collects the required
 * phone at registration time directly in the onboarding application form.
 */
export const registerSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    fullName: z
      .string()
      .min(2, { message: "Full name must be at least 2 characters." }),
    role: z.enum(["USER", "SELLER", "RIDER"]).default("USER"),
    phone: z
      .string()
      .trim()
      .regex(/^\+?\d{10,15}$/, {
        message: "Phone number must be 10 to 15 digits (optionally prefixed with +).",
      })
      .optional(),
  })
  .refine((data) => data.role === "USER" || !!data.phone, {
    message: "Phone number is required for seller and rider registrations.",
    path: ["phone"],
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
 * Phone is included so Google-only users can backfill one for identity
 * verification before the seller/rider approval flow.
 */
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d{10,15}$/, {
      message: "Phone number must be 10 to 15 digits (optionally prefixed with +).",
    })
    .optional(),
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
