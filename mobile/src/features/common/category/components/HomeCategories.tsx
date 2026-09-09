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
import { Ionicons } from "@expo/vector-icons";

const HomeCategories = ({ rootSlug = "clothing" }: { rootSlug?: string }) => {
  const theme = useTheme() as any;
  const router = useRouter();
  const [showAll, setShowAll] = React.useState(false);
  const { data: rawCategories, isLoading, error } = useCategories({ vertical: "CLOTHING" });

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      activeOpacity={0.7}
      accessibilityRole="link"
      accessibilityLabel={`Shop ${item.title}`}
      {...({ title: `Shop ${item.title} on QuickBihar` } as any)}
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
          alt={`${item.title} - Clothing Category in Bihar`}
          accessibilityLabel={`${item.title} Category`}
          {...({ title: `${item.title} | QuickBihar Online Shopping` } as any)}
        />
      </View>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const { visibleCategories, totalCount } = React.useMemo(() => {
    if (!rawCategories || rawCategories.length === 0) return { visibleCategories: [], totalCount: 0 };

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
        !lower.includes("grocery") &&
        !lower.includes("accessori")
      );
    });

    // Find the root category (e.g. "clothing") if specified
    const targetSlug = (rootSlug || "clothing").toLowerCase();
    const rootCat = categories.find(
      (cat) =>
        cat.slug?.toLowerCase() === targetSlug ||
        cat.title?.toLowerCase() === targetSlug
    );

    let eligible: Category[];
    if (rootCat) {
      const childCategories = categories.filter((cat) => {
        const pId = typeof cat.parentId === "object" ? (cat.parentId as any)?._id : cat.parentId;
        return pId && pId.toString() === rootCat._id.toString();
      });
      eligible = childCategories.length > 0 ? childCategories : categories.filter((cat) => !cat.parentId);
    } else {
      eligible = categories.filter((cat) => !cat.parentId);
    }

    // Filter out categories explicitly marked as not visible on home
    const homeEligible = eligible.filter((cat) => cat.isVisibleOnHome !== false);

    // Sort by homePosition (1, 2, 3...) then priority (descending)
    homeEligible.sort((a, b) => {
      const posA = a.homePosition && a.homePosition > 0 ? a.homePosition : 999;
      const posB = b.homePosition && b.homePosition > 0 ? b.homePosition : 999;
      if (posA !== posB) return posA - posB;
      return (b.priority || 0) - (a.priority || 0);
    });

    const totalCount = homeEligible.length;
    const visibleCategories = showAll ? homeEligible : homeEligible.slice(0, 5);

    return { visibleCategories, totalCount };
  }, [rawCategories, rootSlug, showAll]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <FlashList
          data={[1, 2, 3, 4, 5]}
          renderItem={() => <CategorySkeleton />}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  if (error || !rawCategories || visibleCategories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlashList
        className="gap-28"
        data={visibleCategories}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.m,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
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
