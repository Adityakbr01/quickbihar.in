import type { Request, Response, NextFunction } from "express";

/**
 * Lightweight request/response logger.
 *
 * Security note: request bodies can contain credentials (passwords, OTPs, ID tokens).
 * Body logging is gated behind NODE_ENV !== 'production' so production logs never
 * capture sensitive fields. Enable only in dev/staging.
 */
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const isProd = process.env.NODE_ENV === "production";

  // Log the request
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

  // Body dump is dev-only. Production logs would otherwise capture passwords,
  // Google ID tokens, OTPs (until OTP cut-over), and reset-password tokens.
  if (!isProd && (req.method === "POST" || req.method === "PUT" || req.method === "PATCH")) {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }

  // Once the request finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};
