import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BUXAR_BLOCKS, type BuxarLocation } from "@/src/constants/locations/buxar";

export const HomeDeliveryLocations: React.FC = () => {
  const theme = useTheme();

  // Priority towns for quick-chips
  const keyLocations = [
    { name: "Buxar City", slug: "buxar-city", pin: "802101", timing: "60-120 min" },
    { name: "Dumraon", slug: "dumraon", pin: "802119", timing: "60-120 min" },
    { name: "Chausa", slug: "chausa", pin: "802114", timing: "Same Day" },
    { name: "Itarhi", slug: "itarhi", pin: "802123", timing: "Same Day" },
    { name: "Rajpur", slug: "rajpur", pin: "802113", timing: "Same Day" },
    { name: "Brahampur", slug: "brahampur", pin: "802112", timing: "Same Day" },
    { name: "Nawanagar", slug: "nawanagar", pin: "802129", timing: "Same Day" },
    { name: "Simri", slug: "simri", pin: "802118", timing: "Same Day" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.badgeRow}>
            <Ionicons name="flash" size={13} color="#4F46E5" />
            <Text style={styles.badgeText}>INSTANT DELIVERY</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            Fast Delivery in Buxar & Bihar
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            Order fashion & clothing online with doorstep delivery across 26+ PIN codes
          </Text>
        </View>

        <Link href={"/locations/bihar/buxar" as any} asChild>
          <Pressable
            style={[styles.districtBtn, { backgroundColor: "#EEF2FF" }]}
            accessibilityRole="link"
            accessibilityLabel="Explore Buxar District Delivery Hub"
          >
            <Text style={styles.districtBtnText}>All Buxar Hubs</Text>
            <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
          </Pressable>
        </Link>
      </View>

      {/* Town Grid Chips with Accessible Links */}
      <View style={styles.chipsGrid}>
        {keyLocations.map((loc) => {
          const href = `/locations/bihar/buxar/${loc.slug}` as any;
          return (
            <Link key={loc.slug} href={href} asChild>
              <Pressable
                style={[
                  styles.locationCard,
                  {
                    backgroundColor: theme.secondaryBackground || "#F8FAFC",
                    borderColor: theme.border || "#E2E8F0",
                  },
                ]}
                accessibilityRole="link"
                accessibilityLabel={`Shop clothing & fashion in ${loc.name}, Buxar PIN ${loc.pin}`}
              >
                <View style={styles.cardTop}>
                  <Ionicons name="location-sharp" size={14} color="#4F46E5" />
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                    {loc.name}
                  </Text>
                </View>
                <View style={styles.cardBottom}>
                  <Text style={[styles.pinText, { color: theme.secondaryText }]}>
                    PIN {loc.pin}
                  </Text>
                  <Text style={styles.timingBadge}>{loc.timing}</Text>
                </View>
              </Pressable>
            </Link>
          );
        })}
      </View>

      {/* SEO Natural Text & All 11 Blocks Breadcrumb Links */}
      <View style={[styles.footerSeoWrap, { borderTopColor: theme.border || "#F1F5F9" }]}>
        <Text style={[styles.seoPara, { color: theme.secondaryText }]}>
          Serving Buxar Sadar & Dumraon Subdivisions:{" "}
          {BUXAR_BLOCKS.map((b: BuxarLocation, idx: number) => (
            <React.Fragment key={b.slug}>
              <Link
                href={`/locations/bihar/buxar/${b.slug}` as any}
                style={[styles.inlineLink, { color: "#4F46E5" }]}
              >
                {b.name}
              </Link>
              {idx < BUXAR_BLOCKS.length - 1 ? " • " : ""}
            </React.Fragment>
          ))}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 10,
    flexWrap: "wrap",
  },
  titleWrap: {
    flex: 1,
    minWidth: 200,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  districtBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  districtBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  locationCard: {
    width: "48%",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  pinText: {
    fontSize: 11,
    fontWeight: "500",
  },
  timingBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  footerSeoWrap: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  seoPara: {
    fontSize: 11,
    lineHeight: 18,
  },
  inlineLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default HomeDeliveryLocations;
