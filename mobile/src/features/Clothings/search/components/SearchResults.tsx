import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { IProduct } from "../../product/types/product.types";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

interface SearchResultsProps {
  results: IProduct[];
  loading: boolean;
  onItemPress: (id: string) => void;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
}

const SearchResults = ({ 
  results, 
  loading, 
  onItemPress,
  onEndReached,
  isFetchingNextPage
}: SearchResultsProps) => {
  const theme = useTheme();

  if (loading && results.length === 0) {
    return (
      <View style={styles.skeletonContainer}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={styles.skeletonItem}>
            <View style={[styles.skeletonImage, { backgroundColor: theme.tertiaryBackground }]} />
            <View style={[styles.skeletonText, { backgroundColor: theme.tertiaryBackground, width: "80%" }]} />
            <View style={[styles.skeletonText, { backgroundColor: theme.tertiaryBackground, width: "50%" }]} />
          </View>
        ))}
      </View>
    );
  }

  if (results.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="shirt-outline" size={60} color={theme.tertiaryText} />
        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
          No items found for your search.
        </Text>
      </View>
    );
  }

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  };

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item._id}
      numColumns={2}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnWrapper}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.productCard, { backgroundColor: theme.background }]}
          onPress={() => onItemPress(item._id)}
        >
          <View style={styles.imageContainer}>
            <ExpoImage
              source={{ uri: item.images?.[0]?.url }}
              contentFit="cover"
              style={styles.productImage}
              transition={200}
            />
            {item.discountPercentage > 0 && (
              <View style={[styles.discountBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.discountText}>{Math.round(item.discountPercentage)}% OFF</Text>
              </View>
            )}
            {item.ratings && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.ratingText}>{item.ratings.average.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: theme.text }]}>₹{item.price.toLocaleString()}</Text>
              {item.originalPrice > item.price && (
                <Text style={[styles.originalPrice, { color: theme.tertiaryText }]}>
                  ₹{item.originalPrice.toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      )}
    />
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 16,
  },
  skeletonItem: {
    width: COLUMN_WIDTH,
    marginBottom: 16,
  },
  skeletonImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productCard: {
    width: COLUMN_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  ratingBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000000",
  },
  infoContainer: {
    paddingVertical: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default SearchResults;
