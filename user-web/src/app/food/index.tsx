import React from "react";
import { FoodHomeScreen } from "@/src/features/Food/screens/FoodHomeScreen";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

export default function FoodRoute() {
  return (
    <>
      <NoIndexHead />
      <FoodHomeScreen />
    </>
  );
}
