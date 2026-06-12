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

const HomeCategories = () => {
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
          params: { query: item.title },
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

  const featuredCategories = React.useMemo(() => {
    if (!categories) return [];
    const featured = categories.filter((cat) => cat.isFeatured || cat.isFeature);
    if (featured.length > 0) return featured;
    return categories.filter((cat) => !cat.parentId); // fallback to root categories
  }, [categories]);

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
        data={featuredCategories}
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
