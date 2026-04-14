import React from "react";
import ProfileInfoScreen from "@/src/features/profileInfo/screen/ProfileInfoScreen";
import { Stack } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

const ProfileInfoPage = () => {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerTitle: "Profile Info",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }} 
      />
      <ProfileInfoScreen />
    </>
  );
};

export default ProfileInfoPage;
