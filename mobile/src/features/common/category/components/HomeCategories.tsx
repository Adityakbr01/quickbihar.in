import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { spacing } from "@/src/theme/spacing";
import { BREAKPOINTS } from "@/src/utils/responsive";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;
  const [showAll, setShowAll] = React.useState(false);
  const { data: rawCategories, isLoading, error } = useCategories({ vertical: "CLOTHING" });
  // Desktop rail scroll position + arrow stepping (3 tiles per click).
  const railRef = React.useRef<ScrollView>(null);
  const railOffset = React.useRef(0);
  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollTo({
      x: Math.max(0, railOffset.current + dir * 420),
      animated: true,
    });
  };

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

  // Desktop web: premium centered grid (up to 10 tiles, larger artwork,
  // hover lift). Mobile path below is byte-identical to before.
  if (isDesktop) {
    const gridData = (showAll ? visibleCategories : visibleCategories.slice(0, 10));
    // Reuse the full eligible list when collapsed to 5 mobile items —
    // desktop shows more without an extra fetch.
    const desktopList = showAll
      ? gridData
      : (rawCategories || [])
          .filter((cat: any) => {
            if ((cat as any).vertical && (cat as any).vertical !== "CLOTHING") return false;
            const lower = String((cat as any).title || "").toLowerCase();
            return (
              !lower.includes("jewel") &&
              !lower.includes("food") &&
              !lower.includes("grocery") &&
              !lower.includes("accessori")
            );
          })
          .slice(0, 10);
    return (
      <View style={[styles.container, desktopStyles.wrap]}>
        {/* Left-aligned heading like mobile section headers. */}
        <View style={desktopStyles.headingWrap}>
          <Text style={[desktopStyles.heading, { color: theme.text }]}>
            Shop by category
          </Text>
        </View>
        {/* Single scrollable rail — all tiles in one line, never wrapping. */}
        <View style={desktopStyles.railWrap}>
          <ScrollView
            ref={railRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              railOffset.current = e.nativeEvent.contentOffset.x;
            }}
            style={desktopStyles.rail}
            contentContainerStyle={desktopStyles.railContent}
          >
          {desktopList.map((item: any) => (
            <TouchableOpacity
              key={item._id}
              style={desktopStyles.tile}
              activeOpacity={0.8}
              accessibilityRole="link"
              accessibilityLabel={`Shop ${item.title}`}
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
              <View
                style={[
                  desktopStyles.thumb,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.secondaryBackground,
                  },
                ]}
              >
                <Image
                  source={{ uri: item.image }}
                  style={desktopStyles.img}
                  contentFit="cover"
                  transition={200}
                />
              </View>
              <Text style={[desktopStyles.label, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => scrollRail(-1)}
            accessibilityRole="button"
            accessibilityLabel="Scroll categories left"
            activeOpacity={0.8}
            style={[
              desktopStyles.railArrow,
              desktopStyles.railArrowLeft,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Text style={[desktopStyles.railArrowText, { color: theme.text }]}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => scrollRail(1)}
            accessibilityRole="button"
            accessibilityLabel="Scroll categories right"
            activeOpacity={0.8}
            style={[
              desktopStyles.railArrow,
              desktopStyles.railArrowRight,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Text style={[desktopStyles.railArrowText, { color: theme.text }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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

// Desktop-only styles — never applied on native / mobile web.
const desktopStyles = StyleSheet.create({
  wrap: { marginVertical: 28, paddingHorizontal: 24, alignItems: "center" },
  headingWrap: {
    width: "100%",
    maxWidth: 1080,
    alignItems: "flex-start",
    paddingHorizontal: 24,
  },
  heading: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5, marginBottom: 20, textAlign: "left" },
  // Single-line scrollable rail (replaces the old wrapping grid).
  railWrap: {
    position: "relative",
    width: "100%",
    maxWidth: 1080,
    alignItems: "center",
  },
  rail: {
    width: "100%",
  },
  railContent: {
    gap: 22,
    // Generous end padding so the last tile scrolls fully into view.
    paddingHorizontal: 24,
    paddingBottom: 10,
    alignItems: "flex-start",
  },
  railArrow: {
    position: "absolute",
    top: 32,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    ...Platform.select({
      web: { cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.18)" } as any,
    }),
  },
  railArrowLeft: {
    left: 28,
  },
  railArrowRight: {
    right: 28,
  },
  railArrowText: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 30,
    marginTop: -3,
  },
  tile: { alignItems: "center", width: 118 },
  thumb: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  img: { width: "100%", height: "100%" },
  label: { fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: 10 },
});
