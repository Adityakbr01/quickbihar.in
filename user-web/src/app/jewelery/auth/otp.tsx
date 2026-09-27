import { Redirect } from "expo-router";
import React from "react";

/**
 * Retired route — the server removed /auth/request-otp + /auth/verify-otp
 * (post-OTP cutover), so phone-OTP login no longer exists.
 * Jewelry auth now uses Email & Password + Google (see sign-in.tsx).
 * Kept as a redirect so old deep links don't land on a blank screen.
 */
export default function OtpRetiredRoute() {
  return <Redirect href={"/jewelery/auth/sign-in" as any} />;
}
