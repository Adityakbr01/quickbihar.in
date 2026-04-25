import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Theme, useTheme } from "@/src/theme/Provider/ThemeProvider";
import { IProduct } from "../types/product.types";
import { AiEditingIcon, Delete02Icon, PackageIcon } from "@hugeicons/core-free-icons";

interface ProductListProps {
  products: IProduct[];
  onEdit: (product: IProduct) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const ProductList = ({ products, onEdit, onDelete, loading }: ProductListProps) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />;
  }

  if (products.length === 0) {
    return (
      <View style={styles.empty}>
        <HugeiconsIcon icon={PackageIcon} size={48} color={theme.tertiaryText} />
        <Text style={styles.emptyText}>No products found</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: IProduct }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.images && item.images[0]?.url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {item.discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {item.discountLabel || `${Math.round(item.discountPercentage)}% OFF`}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>
          {item.brand} • {item.category}
        </Text>
        <Text style={styles.cardPrice}>
          ₹{item.price} <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
        </Text>
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>Stock: {item.totalStock}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
          <HugeiconsIcon icon={AiEditingIcon} size={20} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item._id)} style={styles.actionBtn}>
          <HugeiconsIcon icon={Delete02Icon} size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: {
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: theme.background,
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    thumbnail: {
      width: 70,
      height: 70,
      borderRadius: 12,
      backgroundColor: theme.tertiaryBackground,
    },
    cardContent: {
      flex: 1,
      marginLeft: 12,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontSize: 12,
      color: theme.tertiaryText,
      marginBottom: 4,
    },
    cardPrice: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
    },
    originalPrice: {
      fontSize: 11,
      color: theme.tertiaryText,
      textDecorationLine: "line-through",
      fontWeight: "400",
    },
    stockBadge: {
      marginTop: 4,
      alignSelf: "flex-start",
      backgroundColor: theme.tertiaryBackground,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    stockText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.tertiaryText,
    },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionBtn: {
      padding: 8,
      marginLeft: 4,
    },
    empty: {
      alignItems: "center",
      marginTop: 60,
    },
    emptyText: {
      marginTop: 12,
      color: theme.tertiaryText,
      fontSize: 16,
    },
    imageContainer: {
      width: 70,
      height: 70,
      position: "relative",
    },
    discountBadge: {
      position: "absolute",
      top: -6,
      left: -6,
      backgroundColor: theme.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1,
      zIndex: 10,
    },
    discountText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "800",
    },
  });

export default ProductList;
