import { Redirect } from "expo-router";
import React from "react";

export default function JeweleryRoute() {
  return <Redirect href={"/jewelery/(tabs)" as any} />;
}
