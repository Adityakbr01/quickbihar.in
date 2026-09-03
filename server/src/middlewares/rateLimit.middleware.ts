/**
 * Auth rate limiters — `express-rate-limit` factory wrappers.
 *
 * Used to throttle credential-stuffing and abuse on public auth endpoints.
 * Counters are in-memory by default (suitable for single-process Bun). For a
 * multi-process deploy, swap to a Redis store via `rate-limit-redis`.
 */
import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

/** 10 req/min/IP — for `/auth/google`, `/auth/login`, `/auth/register`, `/auth/refresh-token`, `/auth/request-reset`. */
export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    error: "Too many requests. Please slow down and try again shortly.",
  },
});

/** 5 req/min/IP — stricter, for password-mutating endpoints. */
export const strictAuthRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    error: "Too many attempts. Please wait a minute and try again.",
  },
});