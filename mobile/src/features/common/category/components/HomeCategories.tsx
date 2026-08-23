import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { spacing } from "@/src/theme/spacing";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useCategories } from "../hooks/useCategories";
import { Category } from "../types/category.types";
import CategorySkeleton from "./CategorySkeleton";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

const HomeCategories = ({ rootSlug = "clothing" }: { rootSlug?: string }) => {
  const theme = useTheme() as any;
  const router = useRouter();
  const { data: rawCategories, isLoading, error } = useCategories({ vertical: "CLOTHING" });

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({
          pathname: "/(tabs)/clothing/search" as any,
          params: {
            query: item.title,
            categoryName: item.title,
            subCategory: item.title,
            categoryId: item._id,
          },
        });
      }}
    >
      <View style={[styles.imageContainer, { borderColor: theme.border }]}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </View>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const displayedCategories = React.useMemo(() => {
    if (!rawCategories || rawCategories.length === 0) return [];

    // Filter only clothing categories (exclude Jewellery, etc.)
    const categories = rawCategories.filter((cat) => {
      if (cat.vertical && cat.vertical !== "CLOTHING") return false;
      const lower = cat.title.toLowerCase();
      return (
        !lower.includes("jewel") &&
        !lower.includes("necklace") &&
        !lower.includes("jhumka") &&
        !lower.includes("bangle") &&
        !lower.includes("earring") &&
        !lower.includes("ring") &&
        !lower.includes("food") &&
        !lower.includes("grocery")
      );
    });

    // Find the root category (e.g. "clothing")
    const targetSlug = (rootSlug || "clothing").toLowerCase();
    const rootCat = categories.find(
      (cat) =>
        cat.slug?.toLowerCase() === targetSlug ||
        cat.title?.toLowerCase() === targetSlug
    );

    if (rootCat) {
      const childCategories = categories.filter((cat) => {
        const pId = typeof cat.parentId === "object" ? (cat.parentId as any)?._id : cat.parentId;
        return pId && pId.toString() === rootCat._id.toString();
      });
      if (childCategories.length > 0) {
        return childCategories;
      }
    }

    // Fallback: all subcategories (having a parentId)
    const subCategories = categories.filter((cat) => Boolean(cat.parentId));
    if (subCategories.length > 0) {
      return subCategories;
    }

    const featured = categories.filter((cat) => cat.isFeatured || cat.isFeature);
    if (featured.length > 0) return featured;

    return categories;
  }, [rawCategories, rootSlug]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <FlashList
          data={[1, 2, 3, 4, 5, 6]}
          renderItem={() => <CategorySkeleton />}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  if (error || !rawCategories) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlashList
        className="gap-28"
        data={displayedCategories}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default HomeCategories;

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.m,
  },
  categoryItem: {
    alignItems: "center",
    width: 70,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
});
