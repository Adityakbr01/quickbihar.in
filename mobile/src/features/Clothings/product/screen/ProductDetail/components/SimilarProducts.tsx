import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { IProduct } from "../../../types/product.types";
import { styles as s } from "../styles";

interface SimilarProductsProps {
  products: IProduct[];
  theme: any;
}

export const SimilarProducts = ({ products, theme }: SimilarProductsProps) => {
  const router = useRouter();

  if (!products || products.length === 0) return null;

  return (
    <View style={[s.similarSection, { backgroundColor: theme.background }]}>
      <Text style={[s.selectionLabel, { color: theme.text, paddingHorizontal: 16 }]}>
        SIMILAR PRODUCTS
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.similarScroll}
      >
        {products.map((item) => (
          <TouchableOpacity
            key={item._id}
            style={[
              s.similarCard,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: "/product/[id]",
                params: { id: item._id },
              })
            }
          >
            <Image
              source={{ uri: item.images?.[0]?.url }}
              style={s.similarImage}
              resizeMode="cover"
            />
            <View style={s.similarInfo}>
              <Text
                style={[s.similarBrand, { color: theme.secondaryText }]}
                numberOfLines={1}
              >
                {item.brand}
              </Text>
              <Text
                style={[s.similarTitle, { color: theme.text }]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <View style={s.similarPriceRow}>
                <Text style={[s.similarPrice, { color: theme.text }]}>
                  ₹{item.price?.toLocaleString()}
                </Text>
                {item.originalPrice && item.originalPrice > item.price && (
                  <Text style={[s.similarMrp, { color: theme.tertiaryText }]}>
                    ₹{item.originalPrice.toLocaleString()}
                  </Text>
                )}
              </View>
              {item.ratings && item.ratings.count > 0 && (
                <View style={s.similarRating}>
                  <View style={s.similarRatingPill}>
                    <Text style={s.similarRatingText}>
                      {item.ratings.average}
                    </Text>
                    <Ionicons name="star" size={9} color="#fff" />
                  </View>
                  <Text
                    style={[
                      s.similarRatingCount,
                      { color: theme.tertiaryText },
                    ]}
                  >
                    ({item.ratings.count})
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
