import { Redirect } from "expo-router";

export default function Index() {
  const isLoggedIn = true; // replace with real auth

  if (!isLoggedIn) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/home" />;
}
