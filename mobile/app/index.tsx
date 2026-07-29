import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useModuleStore } from "@/src/store/useModuleStore";
import { APP_MODULES } from "@/src/constants/modules";

export default function Index() {
  const { currentModuleId, isHydrated } = useModuleStore();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  }

  const activeModule = APP_MODULES.find((m) => m.id === currentModuleId) || APP_MODULES[0];
  return <Redirect href={activeModule.route as any} />;
}
