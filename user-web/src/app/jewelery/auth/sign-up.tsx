import { Redirect } from "expo-router";
import React from "react";

/**
 * Retired — jewelry uses the same one-tap Google flow as clothing:
 * sign-in registers new users automatically. Kept as a redirect so
 * old links don't land on a blank screen.
 */
export default function SignUpRetiredRoute() {
  return <Redirect href={"/jewelery/auth/sign-in" as any} />;
}
