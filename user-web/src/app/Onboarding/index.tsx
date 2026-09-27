import { StyleSheet } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import OnboardingScreen from "@/src/features/Onboarding/screens/OnboardingScreen";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

const index = () => {
  const router = useRouter();

  return (
    <>
      <NoIndexHead />
      <OnboardingScreen onDone={() => router.replace("/auth")} />
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
