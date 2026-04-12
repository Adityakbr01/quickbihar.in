import { StyleSheet } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import OnboardingScreen from "@/src/features/Onboarding/screens/OnboardingScreen";

const index = () => {
  const router = useRouter();

  return <OnboardingScreen onDone={() => router.replace("/auth")} />;
};

export default index;

const styles = StyleSheet.create({});
