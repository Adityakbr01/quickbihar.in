import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { SeoHead } from "@/src/components/seo/SeoHead";
import { TextInput } from "@/src/theme/components/TextInput";
import { staticPageMeta, breadcrumbJsonLd, faqJsonLd } from "@/src/lib/seo";
import HomeDeliveryLocations from "@/src/features/clothing/home/components/HomeDeliveryLocations";
import { ALL_BUXAR_PAGES } from "@/src/constants/locations/buxar";

export default function InstantDeliveryRoute() {
  const theme = useTheme() as any;
  const router = useRouter();
  const [pinQuery, setPinQuery] = useState("");
  const [pinResult, setPinResult] = useState<string | null>(null);
  const isDark = theme.isDark ?? theme.text === "#ffffff";

  const meta = staticPageMeta({
    title: "Instant Fashion & Clothes Delivery in Bihar | QuickBihar",
    description:
      "Check same day & instant doorstep delivery coverage for fashion, kurtis, sarees, shirts & kids clothing across Buxar, Dumraon and Bihar. Fast delivery across 26+ PIN codes.",
    path: "/instant-delivery",
    image: "https://quickbihar.in/assets/images/icons/splash-icon.png",
    indexable: true,
  });

  const breadcrumbs = breadcrumbJsonLd(meta.canonical, [
    { name: "Home", path: "/" },
    { name: "Instant Delivery", path: "/instant-delivery" },
  ]);

  const deliveryFaqs = [
    {
      question: "Which areas in Bihar have instant fashion delivery?",
      answer:
        "QuickBihar provides 60-120 minute express delivery in Buxar City and Dumraon, and same-day delivery across all 11 blocks of Buxar district including Chausa, Itarhi, Rajpur, Brahampur, Nawanagar, and Simri.",
    },
    {
      question: "How do I check if my PIN code is eligible for delivery?",
      answer:
        "Enter your 6-digit postal PIN code in the search box above to check delivery speed and available local fashion boutiques.",
    },
    {
      question: "What products are available for fast doorstep delivery?",
      answer:
        "Women's kurtis, sarees, bridal wear, men's casual shirts, jeans, ethnic kurtas, kids clothing, and daily fashion accessories from verified local stores.",
    },
  ];

  const faqSchema = faqJsonLd(deliveryFaqs);

  const handleCheckPin = () => {
    const trimmed = pinQuery.trim();
    if (trimmed.length !== 6) {
      setPinResult("Please enter a valid 6-digit PIN code.");
      return;
    }

    const matchedLocation = ALL_BUXAR_PAGES.find((loc) =>
      loc.pins.includes(trimmed)
    );

    if (matchedLocation) {
      setPinResult(
        `✅ Delivery available in ${matchedLocation.name}! Timing: ${matchedLocation.deliveryTime}.`
      );
    } else {
      setPinResult(
        `📍 Delivery expanding soon to PIN ${trimmed}. Standard shipping available across Bihar.`
      );
    }
  };

  return (
    <SafeViewWrapper>
      <Stack.Screen options={{ headerShown: false }} />
      <SeoHead meta={meta} jsonLd={[breadcrumbs, faqSchema]} />

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { borderBottomColor: theme.border || "#E2E8F0" }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)/clothing/home")}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: theme.text }]}>
            Instant Delivery Coverage
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={[styles.heroCard, isDark
            ? { backgroundColor: "#1E1B4B", borderColor: "rgba(129,140,248,0.45)" }
            : { backgroundColor: "#EEF2FF", borderColor: "#C7D2FE" }]}>
            <View style={[styles.flashBadge, isDark && { backgroundColor: "rgba(255,255,255,0.14)" }]}>
              <Ionicons name="flash" size={14} color={isDark ? "#C7D2FE" : "#4F46E5"} />
              <Text style={[styles.flashBadgeText, isDark && { color: "#C7D2FE" }]}>60–120 MINS EXPRESS</Text>
            </View>
            <Text style={[styles.heroHeading, isDark && { color: "#FFFFFF" }]}>
              Instant Fashion &amp; Clothes Delivery in Bihar
            </Text>
            <Text style={[styles.heroSub, isDark && { color: "#C7D2FE" }]}>
              Discover trendy ethnic wear, kurtis, sarees, shirts, and jeans delivered straight to your doorstep from trusted local stores in your area.
            </Text>
          </View>

          {/* Quick PIN Code Checker */}
          <View style={[styles.pinCheckCard, { backgroundColor: theme.secondaryBackground || "#F8FAFC", borderColor: theme.border || "#E2E8F0" }]}>
            <Text style={[styles.pinCheckTitle, { color: theme.text }]}>
              Check Delivery in Your Area
            </Text>
            <Text style={[styles.pinCheckSub, { color: theme.secondaryText }]}>
              Enter your 6-digit PIN code to check instant delivery availability
            </Text>

            <View style={styles.pinInputRow}>
              <TextInput
                placeholder="e.g. 802101"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={6}
                value={pinQuery}
                onChangeText={(t) => {
                  setPinQuery(t);
                  setPinResult(null);
                }}
                containerStyle={{ marginBottom: 0, flex: 1 }}
                inputContainerStyle={{
                  backgroundColor: theme.background,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 44,
                  borderWidth: 1,
                }}
                style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
              />
              <TouchableOpacity
                style={styles.checkBtn}
                onPress={handleCheckPin}
                accessibilityRole="button"
                accessibilityLabel="Check PIN delivery"
              >
                <Text style={styles.checkBtnText}>Check</Text>
              </TouchableOpacity>
            </View>

            {pinResult && (
              <View style={[styles.resultBox, isDark && { backgroundColor: theme.tertiaryBackground }]}>
                <Text style={[styles.resultText, isDark && { color: theme.text }]}>{pinResult}</Text>
              </View>
            )}
          </View>

          {/* Local Hubs & Towns Matrix Component */}
          <HomeDeliveryLocations />

          {/* FAQs Section */}
          <View style={styles.faqSection}>
            <Text style={[styles.faqSectionTitle, { color: theme.text }]}>
              Frequently Asked Questions
            </Text>
            {deliveryFaqs.map((faq, i) => (
              <View
                key={i}
                style={[
                  styles.faqItem,
                  {
                    backgroundColor: theme.secondaryBackground || "#F8FAFC",
                    borderColor: theme.border || "#E2E8F0",
                  },
                ]}
              >
                <Text style={[styles.faqQ, { color: theme.text }]}>
                  {faq.question}
                </Text>
                <Text style={[styles.faqA, { color: theme.secondaryText }]}>
                  {faq.answer}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeViewWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroCard: {
    margin: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  flashBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  flashBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.6,
  },
  heroHeading: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1E1B4B",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    color: "#4338CA",
    lineHeight: 18,
  },
  pinCheckCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  pinCheckTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  pinCheckSub: {
    fontSize: 12,
    marginBottom: 12,
  },
  pinInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  checkBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  resultBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  resultText: {
    fontSize: 12,
    color: "#1E293B",
    fontWeight: "600",
  },
  faqSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  faqSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  faqItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  faqQ: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  faqA: {
    fontSize: 12,
    lineHeight: 17,
  },
});
