import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SeoHead } from "@/src/components/seo/SeoHead";
import {
  locationMeta,
  locationJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  canonicalUrl,
} from "@/src/lib/seo";
import {
  ALL_BUXAR_PAGES,
  BUXAR_DISTRICT_HUB,
  BUXAR_LOCATIONS,
  type BuxarLocation,
} from "@/src/constants/locations/buxar";

export default function LocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Normalize slug array: e.g. ["bihar", "buxar", "dumraon"] or ["bihar", "buxar"]
  const slugParts = Array.isArray(params.slug)
    ? params.slug
    : typeof params.slug === "string"
    ? params.slug.split("/").filter(Boolean)
    : [];

  const locationKey =
    slugParts.length >= 3
      ? slugParts[2]
      : slugParts.length === 2 && slugParts[1] === "buxar"
      ? "buxar"
      : slugParts[0] || "buxar";

  const location: BuxarLocation =
    ALL_BUXAR_PAGES.find((loc) => loc.slug === locationKey) || BUXAR_DISTRICT_HUB;

  const pagePath =
    location.slug === "buxar"
      ? "/locations/bihar/buxar"
      : `/locations/bihar/buxar/${location.slug}`;

  const meta = locationMeta({
    title: location.title,
    metaDescription: location.metaDescription,
    keywords: location.keywords,
    path: pagePath,
    image: location.image,
  });

  const schemas: Record<string, any>[] = [];

  const storeSchema = locationJsonLd({
    name: location.name,
    canonical: canonicalUrl(pagePath),
    pins: location.pins,
    subdivision: location.subdivision,
    description: location.metaDescription,
    image: location.image,
  });
  schemas.push(storeSchema);

  const breadcrumbs = breadcrumbJsonLd(
    canonicalUrl(pagePath),
    location.slug === "buxar"
      ? [
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations/bihar/buxar" },
          { name: "Bihar", path: "/locations/bihar/buxar" },
          { name: "Buxar", path: pagePath },
        ]
      : [
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations/bihar/buxar" },
          { name: "Buxar", path: "/locations/bihar/buxar" },
          { name: location.name, path: pagePath },
        ]
  );
  schemas.push(breadcrumbs);

  const faqSchema = faqJsonLd(location.faqs);
  if (faqSchema) schemas.push(faqSchema);

  return (
    <View style={styles.container}>
      <SeoHead meta={meta} jsonLd={schemas} />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/clothing/home")}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Ionicons name="arrow-back" size={20} color="#1E1B4B" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {location.name} • QuickBihar
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Breadcrumb Row */}
        <View style={styles.breadcrumbRow}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/clothing/home")}>
            <Text style={styles.breadcrumbLink}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbSeparator}>/</Text>
          <TouchableOpacity onPress={() => router.push("/locations/bihar/buxar" as any)}>
            <Text style={styles.breadcrumbLink}>Buxar</Text>
          </TouchableOpacity>
          {location.slug !== "buxar" && (
            <>
              <Text style={styles.breadcrumbSeparator}>/</Text>
              <Text style={styles.breadcrumbCurrent}>{location.name}</Text>
            </>
          )}
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.subdivisionBadge}>
              <Text style={styles.subdivisionBadgeText}>{location.subdivision}</Text>
            </View>
            <View style={styles.deliveryBadge}>
              <Ionicons name="flash" size={12} color="#4F46E5" />
              <Text style={styles.deliveryBadgeText}>{location.deliveryTime}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            Online Fashion & Clothes Delivery in {location.name}
          </Text>
          <Text style={styles.heroSubtitle}>{location.metaDescription}</Text>
          <Text style={styles.hindiNote}>
            {location.name} में ऑनलाइन कपड़े मंगाना अब आसान — साड़ी, कुर्ती, जींस और किड्स वियर Cash on Delivery के साथ घर बैठे पाएं।
          </Text>

          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() => router.push("/(tabs)/clothing/home")}
            accessibilityRole="button"
          >
            <Text style={styles.shopNowBtnText}>Shop Trending Clothes in {location.name}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Categories Fast Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Clothing Categories</Text>
          <Text style={styles.sectionSubtitle}>
            Browse top-selling styles available for delivery in {location.name}
          </Text>
          <View style={styles.catGrid}>
            {[
              { title: "Sarees & Ethnic", slug: "sarees", icon: "sparkles" },
              { title: "Kurtis & Suits", slug: "kurtis-suits", icon: "woman" },
              { title: "Men's Wear", slug: "mens-wear", icon: "shirt" },
              { title: "Jeans & Trousers", slug: "jeans", icon: "layers" },
              { title: "Kids & Infant Wear", slug: "kids-wear", icon: "happy" },
              { title: "Western Dresses", slug: "womens-wear", icon: "rose" },
            ].map((cat) => (
              <TouchableOpacity
                key={cat.slug}
                style={styles.catChip}
                onPress={() => router.push(`/category/${cat.slug}` as any)}
                accessibilityRole="button"
              >
                <Ionicons name={cat.icon as any} size={16} color="#4F46E5" />
                <Text style={styles.catChipText}>{cat.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Localities & PIN Codes Served */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localities & Neighborhoods We Serve</Text>
          <Text style={styles.sectionSubtitle}>
            Doorstep clothes delivery to homes, markets & colleges across {location.name}
          </Text>
          <View style={styles.chipsWrap}>
            {location.localities.map((loc, idx) => (
              <View key={idx} style={styles.locChip}>
                <Ionicons name="location-outline" size={13} color="#4B5563" />
                <Text style={styles.locChipText}>{loc}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>PIN Codes Covered</Text>
          <View style={styles.chipsWrap}>
            {location.pins.map((pin) => (
              <View key={pin} style={styles.pinChip}>
                <Text style={styles.pinChipText}>PIN {pin}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ Accordion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSubtitle}>
            Everything you need to know about clothes shopping in {location.name}
          </Text>

          <View style={styles.faqList}>
            {location.faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <View key={idx} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#4B5563"
                    />
                  </TouchableOpacity>
                  {isExpanded && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Other Buxar Locations Cluster */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Areas in Buxar District</Text>
          <View style={styles.chipsWrap}>
            {ALL_BUXAR_PAGES.filter((p) => p.slug !== location.slug).map((other) => {
              const targetPath =
                other.slug === "buxar"
                  ? "/locations/bihar/buxar"
                  : `/locations/bihar/buxar/${other.slug}`;
              return (
                <TouchableOpacity
                  key={other.slug}
                  style={styles.otherLocBtn}
                  onPress={() => router.push(targetPath as any)}
                >
                  <Text style={styles.otherLocBtnText}>{other.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom Local Disclaimer & Assurance */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            © {new Date().getFullYear()} QuickBihar. Local Fashion, Clothing & Daily Essentials with Fast Doorstep Delivery across Buxar, Bihar.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    maxWidth: Platform.OS === "web" ? 480 : undefined,
    width: "100%",
    alignSelf: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E1B4B",
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  breadcrumbLink: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
  },
  breadcrumbSeparator: {
    fontSize: 12,
    color: "#9CA3AF",
    marginHorizontal: 6,
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  subdivisionBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subdivisionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  deliveryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  hindiNote: {
    fontSize: 13,
    color: "#1E3A8A",
    lineHeight: 19,
    marginBottom: 16,
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 8,
  },
  shopNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  shopNowBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 14,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: "48%",
  },
  catChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  locChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  locChipText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  pinChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  pinChipText: {
    fontSize: 12,
    color: "#4338CA",
    fontWeight: "700",
  },
  faqList: {
    gap: 8,
  },
  faqCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FAFAFA",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    paddingRight: 8,
  },
  faqAnswer: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  otherLocBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  otherLocBtnText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
  },
  footerNote: {
    padding: 20,
    alignItems: "center",
  },
  footerNoteText: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
});
