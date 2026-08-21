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
  const theme = useTheme();
  const router = useRouter();
  const { data: categories, isLoading, error } = useCategories();

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({
          pathname: "/(tabs)/clothing/search",
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
    if (!categories || categories.length === 0) return [];
    
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

    // Fallback: all subcategories (having a parentId) or non-root categories
    const subCategories = categories.filter((cat) => Boolean(cat.parentId));
    if (subCategories.length > 0) {
      return subCategories;
    }

    const featured = categories.filter((cat) => cat.isFeatured || cat.isFeature);
    if (featured.length > 0) return featured;

    return categories;
  }, [categories, rootSlug]);

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

  if (error || !categories) {
    return null; // Or show error toast
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={displayedCategories}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default HomeCategories;

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.m,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    gap: spacing.m,
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
