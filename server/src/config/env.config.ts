import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/**
 * Treat empty strings as "not set" so an unset optional in .env (e.g.
 * `GOOGLE_REDIRECT_URI=`) doesn't crash startup. Without this, zod's
 * `.string().url().optional()` rejects the literal "" because empty isn't
 * a valid URL — leaving the field technically defined but unusable.
 */
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalUrl = z
  .preprocess(emptyToUndefined, z.string().url().optional());

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  ACCESS_TOKEN_SECRET: z.string().min(8),
  ACCESS_TOKEN_EXPIRY: z.string().default("1d"),

  REFRESH_TOKEN_SECRET: z.string().min(8),
  REFRESH_TOKEN_EXPIRY: z.string().default("10d"),

  CORS_ORIGIN: z
    .string()
    .default("*")
    .transform((val) => val.split(",").map((s) => s.trim())),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  MATCHING_STAGE4_RADIUS_KM: z.coerce.number().positive().default(8),
  RIDER_MAX_ACCEPTED_ORDERS_PER_WINDOW: z.coerce.number().int().positive().default(15),
  RIDER_ACCEPTANCE_WINDOW_HOURS: z.coerce.number().positive().default(12),
  RIDER_MAX_COD_LIABILITY: z.coerce.number().min(0).default(5000),
  RETURN_WINDOW_DAYS: z.coerce.number().int().positive().default(7),
  RIDER_PAYOUT_UPTO_3_KM: z.coerce.number().min(0).default(20),
  RIDER_PAYOUT_UPTO_5_KM: z.coerce.number().min(0).default(30),
  RIDER_PAYOUT_UPTO_8_KM: z.coerce.number().min(0).default(45),
  RIDER_PAYOUT_EXTRA_PER_KM_AFTER_8: z.coerce.number().min(0).default(5),
  RIDER_PAYOUT_RAIN_BONUS: z.coerce.number().min(0).default(0),
  RIDER_PAYOUT_PEAK_BONUS: z.coerce.number().min(0).default(0),
  RIDER_PAYOUT_FESTIVAL_BONUS: z.coerce.number().min(0).default(0),
  RIDER_PAYOUT_NIGHT_BONUS: z.coerce.number().min(0).default(0),
  MARKETPLACE_COMMISSION_PERCENT: z.coerce.number().min(0).max(100).default(15),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  // ADMIN
  ADMIN_EMAIL: z.string().email().default("admin@quickbihar.in"),
  ADMIN_PASSWORD: z.string().min(8).default("admin123"),

  // IMAGEKIT
  IMAGEKIT_PUBLIC_KEY: z.string().min(1),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1),
  IMAGEKIT_URL_ENDPOINT: z.string().url(),

  // RAZORPAY
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: optionalString,

  // FIREBASE
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .min(1)
    .transform((key) => key.replace(/\\n/g, "\n")),

  // EMAIL
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: z.string().default("Quick Bihar <noreply@quickbihar.in>"),

  // ── Google OAuth (added during auth redesign, Phase 2) ──────────
  // Required for the new ID-token verification flow.
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required for Google sign-in"),
  GOOGLE_CLIENT_SECRET: optionalString,
  GOOGLE_REDIRECT_URI: optionalUrl,
  GOOGLE_ANDROID_CLIENT_ID: optionalString,
  GOOGLE_IOS_CLIENT_ID: optionalString,
  GOOGLE_ANDROID_PACKAGE: optionalString,

  // Reset-password JWT — separate from REFRESH_TOKEN_SECRET so a leak in one
  // doesn't compromise the other. Defaults to REFRESH_TOKEN_SECRET if unset.
  RESET_PASSWORD_JWT_SECRET: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid ENV:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const ENV = parsed.data;
