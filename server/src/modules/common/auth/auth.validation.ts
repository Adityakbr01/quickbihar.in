import { z } from "zod";

export const authenticateSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export const requestOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export type AuthenticateBody = z.infer<typeof authenticateSchema>;
export type RegisterBody = z.infer<typeof registerSchema>;
export type RequestOTPBody = z.infer<typeof requestOTPSchema>;
export type VerifyOTPBody = z.infer<typeof verifyOTPSchema>;
