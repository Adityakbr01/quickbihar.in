import { Resend } from "resend";
import { ENV } from "./env.config";

export const resend = new Resend(ENV.RESEND_API_KEY || "dummy_key");

export const RESEND_FROM = ENV.RESEND_FROM_EMAIL || "Quick Bihar <noreply@voiceact.tech>";

export const isResendConfigured = (): boolean => {
  return Boolean(ENV.RESEND_API_KEY && ENV.RESEND_API_KEY.startsWith("re_"));
};
