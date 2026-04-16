import { Stack } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

export default function AccountLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: "700",
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="addresses"
        options={{
          headerTitle: "Saved Addresses",
        }}
      />
      <Stack.Screen
        name="wishlist"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="address-form"
        options={{
          headerTitle: "Delivery Address",
        }}
      />
    </Stack>
  );
}
