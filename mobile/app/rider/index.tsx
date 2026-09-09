import React from "react";
import RiderWorkspaceScreen from "@/src/features/Delivery/screens/RiderWorkspaceScreen";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

export default function RiderRoute() {
  return (
    <>
      <NoIndexHead />
      <RiderWorkspaceScreen />
    </>
  );
}
