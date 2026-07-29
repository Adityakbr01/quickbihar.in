import MallDetailScreen from "@/src/features/clothing/home/screens/MallDetailScreen";
import { Stack, useLocalSearchParams } from "expo-router";

export default function MallRoute() {
  const { id } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MallDetailScreen id={id as string} />
    </>
  );
}
