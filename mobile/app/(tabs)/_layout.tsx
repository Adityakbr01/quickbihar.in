import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0f0f0f" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="clothing" />
    </Stack>
  );
}
