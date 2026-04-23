import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default(8000),
  MONGODB_URI: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(8),
  ACCESS_TOKEN_EXPIRY: z.string().default("1d"),
  REFRESH_TOKEN_SECRET: z.string().min(8),
  REFRESH_TOKEN_EXPIRY: z.string().default("10d"),
  CORS_ORIGIN: z.string().transform((val) => val.split(",").map((s) => s.trim())).default(["*"]),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

  // ADMIN
  ADMIN_EMAIL: z.string().email().default("admin@gmail.com"),
  ADMIN_PASSWORD: z.string().min(8).default("admin123"),


  // IMAGEKIT 
  IMAGEKIT_PUBLIC_KEY: z.string(),
  IMAGEKIT_PRIVATE_KEY: z.string(),
  IMAGEKIT_URL_ENDPOINT: z.string(),

  //RAZORPAY
  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string(), // right now not implmeneted

  //FIREBASE
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
}

export const ENV = _env.success ? _env.data : ({} as any);
