import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useModuleStore } from "@/src/store/useModuleStore";
import { APP_MODULES } from "@/src/constants/modules";
import { SeoHead } from "@/src/components/seo/SeoHead";
import { staticPageMeta } from "@/src/lib/seo";

const ROOT_META = staticPageMeta({
  title: "QuickBihar | #1 Hyperlocal Shopping & Fashion App in Bihar",
  description:
    "Discover top fashion, clothing, ethnic wear, and daily essentials delivered to your doorstep from trusted local stores and malls across Bihar in 60-120 minutes.",
  path: "/",
  keywords:
    "QuickBihar, Quick Bihar, online shopping Bihar, fastest delivery Bihar, shopping app Bihar, local stores Bihar, clothing store Patna, ethnic wear Bihar, sarees Bihar, buy clothes Buxar, Bihar ecommerce, same day delivery Bihar, cash on delivery Bihar",
  image: "https://quickbihar.in/assets/images/icons/splash-icon.png",
});

export default function Index() {
  const { currentModuleId, isHydrated } = useModuleStore();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <SeoHead meta={ROOT_META} />
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  }

  const activeModule = APP_MODULES.find((m) => m.id === currentModuleId) || APP_MODULES[0];
  return (
    <>
      <SeoHead meta={ROOT_META} />
      <Redirect href={activeModule.route as any} />
    </>
  );
}
