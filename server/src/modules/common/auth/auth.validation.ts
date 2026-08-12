import { z } from "zod";

const emailOrPhoneSchema = z.string().refine((val) => {
  const isEmail = z.string().email().safeParse(val).success;
  const isPhone = /^\d{10}$/.test(val.replace(/\D/g, "").slice(-10));
  return isEmail || isPhone;
}, {
  message: "Invalid email address or 10-digit mobile number",
});

export const authenticateSchema = z.object({
  email: emailOrPhoneSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: emailOrPhoneSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export const requestOTPSchema = z.object({
  email: emailOrPhoneSchema,
});

export const verifyOTPSchema = z.object({
  email: emailOrPhoneSchema,
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export type AuthenticateBody = z.infer<typeof authenticateSchema>;
export type RegisterBody = z.infer<typeof registerSchema>;
export type RequestOTPBody = z.infer<typeof requestOTPSchema>;
export type VerifyOTPBody = z.infer<typeof verifyOTPSchema>;

