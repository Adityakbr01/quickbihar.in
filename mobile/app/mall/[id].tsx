import MallDetailScreen from "@/src/features/clothing/home/screens/MallDetailScreen";
import { manifestToStaticParams } from "@/src/lib/staticManifest";
import { Stack, useLocalSearchParams, Link } from "expo-router";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useMallDetailBySlug } from "@/src/features/clothing/home/hooks/useMalls";

/** Mongo ObjectId detector — ids stay id-fetched; anything else is treated as a canonical slug. */
const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value || "");

let mallsManifest: Record<string, any> = {};
try {
  mallsManifest = require("@/src/data/malls-static.json");
} catch {
  mallsManifest = {};
}

/**
 * generateStaticParams — emits one HTML file per mall slug at build time.
 * Hard-fails if manifest is empty to prevent silent zero-page deploys.
 */
export async function generateStaticParams() {
  return manifestToStaticParams(mallsManifest, "id", "mall/[id]");
}

/**
 * /mall/:param — accepts a legacy Mongo id OR a canonical slug (plan §13).
 * Slug params resolve via GET /malls/slug/:slug, then render the same id-based
 * detail screen. The canonical URL going forward is /mall/:slug.
 */
export default function MallRoute() {
  const { id } = useLocalSearchParams();
  const param = (Array.isArray(id) ? id[0] : id) as string;
  const isId = isObjectId(param || "");
  const slugQuery = useMallDetailBySlug(!isId ? param || "" : "");

  // Manifest seed for the initial SSG render — undefined on native/client.
  const initialMall = !isId && param ? mallsManifest[param] : undefined;

  if (isId || !param) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <MallDetailScreen id={param as string} />
      </>
    );
  }

  if (slugQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      </>
    );
  }

  const resolvedId = (slugQuery.data as any)?.mall?._id;
  if (slugQuery.isError || !resolvedId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text>Mall not found.</Text>
          <Link href="/mall">Back to malls</Link>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MallDetailScreen id={resolvedId} initialMall={initialMall} />
    </>
  );
}
