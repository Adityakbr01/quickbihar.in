import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ModuleSwitcherButton } from "@/src/components/common/ModuleSwitcherButton";
import { useTopPad } from "@/src/hooks/useTopPad";
import {
  APP_CURRENCY,
  APP_NAME,
  JEWELERY_MODULE_CONFIG,
} from "@/src/constants";
import { CollectionCard } from "@/src/features/Jewelery/components/CollectionCard";
import { HeroCarousel } from "@/src/features/Jewelery/components/HeroCarousel";
import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import {
  occasions,
} from "@/src/features/Jewelery/data/collections";
import { useJeweleryBestsellers, useJeweleryCategories, useJeweleryNewArrivals } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import type { Collection } from "@/src/features/Jewelery/data/collections";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

const { width } = Dimensions.get("window");

const testimonials = [
  {
    id: "t1",
    name: "Priya R.",
    city: "Mumbai",
    text: "The Mira pendant is the most beautiful piece I own. I get compliments every single time I wear it.",
    rating: 5,
  },
  {
    id: "t2",
    name: "Aanya S.",
    city: "Bengaluru",
    text: "Bought the Ananya jhumkas for my cousin's wedding — they looked absolutely stunning. Packaging was gorgeous too.",
    rating: 5,
  },
  {
    id: "t3",
    name: "Neha K.",
    city: "Delhi",
    text: "Finally a jewellery brand that feels Indian without feeling dated. The craftsmanship is extraordinary.",
    rating: 5,
  },
];

function AnnouncementBar() {
  const colors = useColors();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // High-contrast emerald & gold luxury palette pairing
  const bg = isDark ? "#122A20" : colors.emerald;
  const textColor = isDark ? "#EAD7B5" : colors.champagne;

  return (
    <View style={[styles.announcementBar, { backgroundColor: bg }]}>
      <Text
        style={[
          styles.announcementText,
          { color: textColor, fontFamily: "DMSans_400Regular" },
        ]}
      >
        Free shipping above {APP_CURRENCY}
        {JEWELERY_MODULE_CONFIG.freeShippingThreshold.toLocaleString("en-IN")} ·
        Hallmarked gold · Try at home available
      </Text>
    </View>
  );
}

function Header() {
  const colors = useColors();
  const topPad = useTopPad();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
        },
      ]}
    >
      <Text
        style={[
          styles.logoText,
          { color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" },
        ]}
      >
        {APP_NAME}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={() => router.push("/jewelery/search")} hitSlop={8}>
          <Feather name="search" size={20} color={colors.ink} />
        </Pressable>
        <ModuleSwitcherButton />
      </View>
    </View>
  );
}

function BrandPillars() {
  const colors = useColors();
  const pillars = [
    { icon: "award", label: "Hallmark\nCertified" },
    { icon: "tool", label: "Handcrafted\nin India" },
    { icon: "refresh-cw", label: "Free Returns\n30 Days" },
    { icon: "home", label: "Try Before\nYou Buy" },
  ];

  return (
    <View
      style={[
        styles.pillarsContainer,
        {
          backgroundColor: colors.ivory,
          borderTopColor: colors.gold,
          borderBottomColor: colors.gold,
        },
      ]}
    >
      {pillars.map((p, i) => (
        <View key={p.label} style={styles.pillar}>
          <Feather name={p.icon as any} size={16} color={colors.gold} />
          <Text
            style={[
              styles.pillarLabel,
              { color: colors.ink, fontFamily: "DMSans_400Regular" },
            ]}
          >
            {p.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SectionHeader({
  label,
  title,
  onSeeAll,
}: {
  label?: string;
  title: string;
  onSeeAll?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View>
        {label && (
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.gold, fontFamily: "DMSans_500Medium" },
            ]}
          >
            {label}
          </Text>
        )}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.ink,
              fontFamily: "CormorantGaramond_500Medium_Italic",
            },
          ]}
        >
          {title}
        </Text>
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text
            style={[
              styles.seeAll,
              { color: colors.gold, fontFamily: "DMSans_400Regular" },
            ]}
          >
            See all
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function FeaturedCollections() {
  const colors = useColors();
  const { data: cats } = useJeweleryCategories();
  const top: Collection[] = (cats ?? []).slice(0, 3).map((c) => ({
    id: c._id,
    name: c.title,
    tagline: "",
    mood: "",
    pieceCount: 0,
    image: c.image ? { uri: c.image } : null,
  }));
  if (!top.length) return null;
  return (
    <View style={[styles.section, { backgroundColor: colors.ivory }]}>
      <SectionHeader
        label="CURATED FOR YOU"
        title="Our Collections"
        onSeeAll={() => router.push("/jewelery/collections" as any)}
      />
      <View style={styles.collectionsGrid}>
        <CollectionCard collection={top[0]} large style={{ flex: 1 }} />
        {top.length > 1 && (
          <View style={styles.collectionsStack}>
            {top.slice(1).map((c) => (
              <CollectionCard key={c.id} collection={c} style={{ flex: 1 }} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function NewArrivals() {
  const colors = useColors();
  const { data: newItems = [], isLoading } = useJeweleryNewArrivals(8);
  if (!isLoading && newItems.length === 0) return null;
  return (
    <View style={[styles.section, { backgroundColor: colors.champagne }]}>
      <SectionHeader
        label="JUST IN"
        title="New Arrivals"
        onSeeAll={() => router.push("/jewelery/collections" as any)}
      />
      {isLoading ? (
        <ActivityIndicator color={colors.gold} />
      ) : (
        <FlatList
          data={newItems}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <ProductCard product={item} style={{ width: 164, marginRight: 12 }} />
          )}
        />
      )}
    </View>
  );
}

function OccasionsSection() {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.ivory }]}>
      <SectionHeader label="FIND YOUR MOMENT" title="Shop by Occasion" />
      <View style={styles.occasionsGrid}>
        {occasions.map((o) => (
          <Pressable
            key={o.id}
            style={({ pressed }) => [
              styles.occasionPill,
              {
                borderColor: colors.gold,
                backgroundColor: pressed ? colors.champagne : "transparent",
              },
            ]}
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <Feather name={o.icon as any} size={13} color={colors.gold} />
            <Text
              style={[
                styles.occasionLabel,
                {
                  color: colors.ink,
                  fontFamily: "CormorantGaramond_500Medium_Italic",
                },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function HeritageSection() {
  const colors = useColors();
  return (
    <View style={[styles.heritageSection, { backgroundColor: colors.pearl }]}>
      <View style={styles.heritageContent}>
        <Text
          style={[
            styles.heritageLabel,
            { color: colors.gold, fontFamily: "DMSans_500Medium" },
          ]}
        >
          OUR CRAFT
        </Text>
        <Text
          style={[
            styles.heritageTitle,
            {
              color: colors.ink,
              fontFamily: "CormorantGaramond_400Regular_Italic",
            },
          ]}
        >
          Every piece holds the memory of hands that shaped it.
        </Text>
        <Text
          style={[
            styles.heritageBody,
            { color: colors.warmGray, fontFamily: "DMSans_300Light" },
          ]}
        >
          We work with master karigar families across Jaipur, Thrissur, and
          Banarasi ateliers — artisans whose craft has been passed down for
          generations.{"\n\n"}Our jewellery is not manufactured. It is made.
        </Text>
        <Pressable onPress={() => {}}>
          <Text
            style={[
              styles.heritageLink,
              { color: colors.gold, fontFamily: "DMSans_400Regular" },
            ]}
          >
            Read Our Story →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function BestsellerSection() {
  const colors = useColors();
  const { data: bestsellers = [], isLoading } = useJeweleryBestsellers(6);
  if (!isLoading && bestsellers.length === 0) return null;
  return (
    <View style={[styles.section, { backgroundColor: colors.ivory }]}>
      <SectionHeader
        label="MOST LOVED"
        title="Bestsellers"
        onSeeAll={() => router.push("/jewelery/collections" as any)}
      />
      <View style={styles.productGrid}>
        {isLoading ? (
          <ActivityIndicator color={colors.gold} style={{ flex: 1 }} />
        ) : (
          bestsellers.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </View>
    </View>
  );
}

function FestiveCampaign() {
  const colors = useColors();
  return (
    <View style={[styles.festiveSec, { backgroundColor: colors.emerald }]}>
      <Text
        style={[
          styles.festiveLabel,
          {
            color: colors.gold,
            fontFamily: "CormorantGaramond_400Regular_Italic",
          },
        ]}
      >
        This festive season —
      </Text>
      <Text
        style={[
          styles.festiveTitle,
          {
            color: "#F7F3EC",
            fontFamily: "CormorantGaramond_300Light_Italic",
          },
        ]}
      >
        Adorn yourself in your own story.
      </Text>
      <Text
        style={[
          styles.festiveBody,
          { color: "rgba(247,243,236,0.7)", fontFamily: "DMSans_300Light" },
        ]}
      >
        Curated festive edits in gold, kundan, and polki. New drops every
        fortnight. Gifting boxes available.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.festiveBtn,
          { backgroundColor: pressed ? colors.goldLight : colors.gold },
        ]}
        onPress={() => router.push("/jewelery/collections" as any)}
      >
        <Text
          style={[
            styles.festiveBtnText,
            { color: colors.ivory, fontFamily: "DMSans_500Medium" },
          ]}
        >
          Shop Festive Edit
        </Text>
      </Pressable>
    </View>
  );
}

function TestimonialsSection() {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.pearl }]}>
      <SectionHeader label="LOVED & TRUSTED" title="What They Say" />
      {testimonials.map((t) => (
        <View
          key={t.id}
          style={[styles.testimonialCard, { backgroundColor: colors.ivory }]}
        >
          <View style={styles.starsRow}>
            {Array.from({ length: t.rating }).map((_, i) => (
              <Feather key={i} name="star" size={12} color={colors.gold} />
            ))}
          </View>
          <Text
            style={[
              styles.testimonialText,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              },
            ]}
          >
            "{t.text}"
          </Text>
          <Text
            style={[
              styles.testimonialMeta,
              { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
            ]}
          >
            — {t.name}, {t.city} · Verified Purchase
          </Text>
        </View>
      ))}
    </View>
  );
}

function GiftingSection() {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.champagne }]}>
      <Text
        style={[
          styles.sectionLabel,
          { color: colors.gold, fontFamily: "DMSans_500Medium" },
        ]}
      >
        GIVE SOMETHING FOREVER
      </Text>
      <Text
        style={[
          styles.giftingTitle,
          {
            color: colors.ink,
            fontFamily: "CormorantGaramond_500Medium_Italic",
          },
        ]}
      >
        Because some gifts outlive the occasion.
      </Text>
      <Text
        style={[
          styles.giftingBody,
          { color: colors.warmGray, fontFamily: "DMSans_300Light" },
        ]}
      >
        Every {APP_NAME} order ships in our signature ivory and gold gift box —
        complimentary. Add a handwritten note. Make it unforgettable.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.giftingBtn,
          {
            borderColor: colors.gold,
            backgroundColor: pressed ? colors.gold : "transparent",
          },
        ]}
      >
        <Text
          style={[
            styles.giftingBtnText,
            { color: colors.gold, fontFamily: "DMSans_400Regular" },
          ]}
        >
          Explore Gifting →
        </Text>
      </Pressable>
    </View>
  );
}

function NewsletterSection() {
  const colors = useColors();
  const [email, setEmail] = React.useState("");

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.ivory, alignItems: "center" },
      ]}
    >
      <Text
        style={[
          styles.newsletterTitle,
          {
            color: colors.ink,
            fontFamily: "CormorantGaramond_400Regular_Italic",
            textAlign: "center",
          },
        ]}
      >
        Be the first to know.
      </Text>
      <Text
        style={[
          styles.newsletterBody,
          {
            color: colors.warmGray,
            fontFamily: "DMSans_300Light",
            textAlign: "center",
          },
        ]}
      >
        New collections. Artisan stories. Early access. Festive drops.
      </Text>
      <View style={[styles.newsletterInput, { borderColor: colors.midGray }]}>
        <Text
          style={[
            styles.newsletterPlaceholder,
            { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
          ]}
        >
          Your email →
        </Text>
        <Pressable
          style={[styles.joinBtn, { backgroundColor: colors.gold }]}
          onPress={() =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          }
        >
          <Text
            style={[
              styles.joinBtnText,
              { color: colors.ivory, fontFamily: "DMSans_500Medium" },
            ]}
          >
            Join the Circle
          </Text>
        </Pressable>
      </View>
      <Text
        style={[
          styles.newsletterFine,
          { color: colors.warmGray, fontFamily: "DMSans_300Light" },
        ]}
      >
        No spam. Only gold.
      </Text>
    </View>
  );
}

export default function JeweleryHomeScreen() {
  const colors = useColors();
  const { data: heroItems } = useJeweleryBestsellers(4);

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 110 : 90 },
        ]}
      >
        <AnnouncementBar />
        <HeroCarousel items={heroItems} />
        <BrandPillars />
        <FeaturedCollections />
        <NewArrivals />
        <OccasionsSection />
        <HeritageSection />
        <BestsellerSection />
        <FestiveCampaign />
        {/* Testimonials hidden until real verified reviews exist. */}
        <GiftingSection />
        <NewsletterSection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  announcementBar: {
    paddingVertical: 8,
    alignItems: "center",
  },
  announcementText: {
    fontSize: 10,
    letterSpacing: 0.8,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    zIndex: 10,
  },
  logoText: {
    fontSize: 18,
    letterSpacing: 4,
  },
  pillarsContainer: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  pillar: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  pillarLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 13,
  },
  section: {
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 26,
    lineHeight: 30,
  },
  seeAll: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  collectionsGrid: {
    flexDirection: "row",
    gap: 10,
    height: 320,
  },
  collectionsStack: {
    flex: 0.6,
    gap: 10,
  },
  horizontalList: {
    paddingRight: 20,
  },
  occasionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  occasionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 20,
  },
  occasionLabel: {
    fontSize: 13,
  },
  heritageSection: {
    minHeight: 0,
  },
  heritageContent: {
    padding: 24,
    gap: 12,
  },
  heritageLabel: {
    fontSize: 9,
    letterSpacing: 2,
  },
  heritageTitle: {
    fontSize: 26,
    lineHeight: 32,
  },
  heritageBody: {
    fontSize: 13,
    lineHeight: 22,
  },
  heritageLink: {
    fontSize: 12,
    letterSpacing: 1,
  },
  trustBar: {
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.5,
    fontStyle: "italic",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  festiveSec: {
    padding: 32,
    gap: 14,
    alignItems: "center",
  },
  festiveLabel: {
    fontSize: 16,
  },
  festiveTitle: {
    fontSize: 36,
    lineHeight: 42,
    textAlign: "center",
  },
  festiveBody: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  festiveBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 1,
    marginTop: 6,
  },
  festiveBtnText: {
    fontSize: 12,
    letterSpacing: 1.5,
  },
  testimonialCard: {
    padding: 16,
    borderRadius: 2,
    gap: 8,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  testimonialText: {
    fontSize: 15,
    lineHeight: 24,
  },
  testimonialMeta: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  giftingTitle: {
    fontSize: 26,
    lineHeight: 32,
  },
  giftingBody: {
    fontSize: 13,
    lineHeight: 22,
  },
  giftingBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
    borderRadius: 1,
  },
  giftingBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  newsletterTitle: {
    fontSize: 30,
    lineHeight: 36,
  },
  newsletterBody: {
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 280,
  },
  newsletterInput: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 1,
    overflow: "hidden",
    alignSelf: "stretch",
    marginTop: 8,
  },
  newsletterPlaceholder: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  joinBtnText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  newsletterFine: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
