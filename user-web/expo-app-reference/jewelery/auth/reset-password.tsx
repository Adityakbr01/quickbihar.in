import { Redirect } from "expo-router";
import React from "react";

/**
 * Retired — jewelry uses the same one-tap Google flow as clothing
 * (no passwords). Kept as a redirect so old links don't break.
 */
export default function ResetPasswordRetiredRoute() {
  return <Redirect href={"/jewelery/auth/sign-in" as any} />;
}
