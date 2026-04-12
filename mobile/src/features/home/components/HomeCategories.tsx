import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { categoriesData, CategoryItem } from "../lib/data";
import { spacing } from "@/src/theme/spacing";

const HomeCategories = () => {
  const theme = useTheme();

  const renderItem = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity style={styles.categoryItem} activeOpacity={0.7}>
      <View style={[styles.imageContainer, { borderColor: theme.border }]}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
      </View>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categoriesData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
    backgroundColor: '#f0f0f0',
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
