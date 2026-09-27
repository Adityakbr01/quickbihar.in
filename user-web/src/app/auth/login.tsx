import React from "react";
import { AuthScreen } from "@/src/features/common/auth";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

export default function LoginRoute() {
  return (
    <>
      <NoIndexHead />
      <AuthScreen />
    </>
  );
}
