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

/**
 * Partner onboarding rate limiter — prevents spamming application submissions and document uploads.
 * Max 6 attempts per 10-minute window per IP.
 */
export const onboardingRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    error: "Too many partner onboarding attempts. Please wait a few minutes before trying again.",
  },
});

/**
 * Public catalog rate limiter — generous bucket for storefront browsing + crawlers.
 * 120 req/min/IP across public product/category/mall reads. Does not affect auth flows.
 */
export const publicCatalogRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    error: "Too many catalog requests. Please slow down and try again shortly.",
  },
});

/**
 * SEO sitemap rate limiter — for /sitemap.xml + shards + /robots.txt (added in plan §18).
 * 60 req/min/IP is ample for crawlers (sitemap cached 1h server-side).
 */
export const seoSitemapRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    error: "Too many sitemap requests. Please slow down and try again shortly.",
  },
});