import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default(8000),
  MONGODB_URI: z.string().url(),
  ACCESS_TOKEN_SECRET: z.string().min(8),
  ACCESS_TOKEN_EXPIRY: z.string().default("1d"),
  REFRESH_TOKEN_SECRET: z.string().min(8),
  REFRESH_TOKEN_EXPIRY: z.string().default("10d"),
  CORS_ORIGIN: z.string().transform((val) => val.split(",").map((s) => s.trim())).default("*"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ADMIN_EMAIL: z.string().email().default("admin@gmail.com"),
  ADMIN_PASSWORD: z.string().min(8).default("admin123"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const ENV = _env.data;
