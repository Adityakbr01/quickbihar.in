import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { usePublicMalls } from "@/src/features/Clothings/home/hooks/useMalls";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function AllMallsScreen() {
  const router = useRouter();
  const theme = useTheme() as any;
  const { data: malls, isLoading, isError, refetch } = usePublicMalls();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredMalls = useMemo(() => {
    if (!malls) return [];
    return malls.filter(
      (mall) =>
        mall.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mall.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mall.tagline && mall.tagline.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [malls, searchQuery]);

  if (isLoading) {
    return (
      <SafeViewWrapper>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <Stack.Screen options={{ title: "Malls", headerShown: true, headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.text }} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
              Discovering fashion malls...
            </Text>
          </View>
        </View>
      </SafeViewWrapper>
    );
  }

  if (isError) {
    return (
      <SafeViewWrapper>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <Stack.Screen options={{ title: "Malls", headerShown: true, headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.text }} />
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={60} color={theme.primary} />
            <Text style={[styles.errorText, { color: theme.text }]}>
              Unable to load malls list.
            </Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeViewWrapper>
    );
  }

  return (
    <SafeViewWrapper>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack.Screen
          options={{
            title: "Explore Malls",
            headerShown: true,
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
          }}
        />

      {/* Search Header */}
      <View style={[styles.searchContainer, { borderBottomColor: theme.border }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.secondaryBackground, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.tertiaryText} style={styles.searchIcon} />
          <TextInput
            placeholder="Search malls by name or city..."
            placeholderTextColor={theme.tertiaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={theme.tertiaryText} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredMalls}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={theme.tertiaryText} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No malls match your search.</Text>
            <Text style={[styles.emptySubText, { color: theme.secondaryText }]}>Try matching a different city or keywords.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.card, { backgroundColor: theme.secondaryBackground, borderColor: theme.border }]}
            onPress={() => router.push(`/mall/${item.id || item._id}` as any)}
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingText}>{item.rating?.toFixed(1) || "4.5"}</Text>
            </View>

            <View style={styles.cardContent}>
              <Text style={[styles.mallName, { color: theme.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              
              <Text style={[styles.tagline, { color: theme.secondaryText }]} numberOfLines={1}>
                {item.tagline}
              </Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={14} color={theme.primary} />
                  <Text style={[styles.detailText, { color: theme.tertiaryText }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="storefront-outline" size={14} color={theme.primary} />
                  <Text style={[styles.detailText, { color: theme.tertiaryText }]} numberOfLines={1}>
                    {item.sellerCount || 0} Stores
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      </View>
    </SafeViewWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
    padding: 0,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#eaeaea",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 4,
  },
  ratingText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  cardContent: {
    padding: 12,
    gap: 4,
  },
  mallName: {
    fontSize: 16,
    fontWeight: "700",
  },
  tagline: {
    fontSize: 12,
    fontWeight: "400",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "50%",
  },
  detailText: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    textAlign: "center",
  },
});
