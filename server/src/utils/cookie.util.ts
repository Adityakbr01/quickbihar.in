import type { CookieOptions } from "express";

export const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

export const getClearCookieOptions = (): CookieOptions => ({
  ...getCookieOptions(),
  expires: new Date(0),
  maxAge: 0,
});
