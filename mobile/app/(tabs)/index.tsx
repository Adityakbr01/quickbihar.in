import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // If user somehow reaches /(tabs)/index, redirect back to Choice Screen
  return <Redirect href="/" />;
}
