import { Award, House, RefreshCw, Star, Wrench } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React, { useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

import { ModuleSwitcherButton } from "@/src/components/common/ModuleSwitcherButton";
import { useTopPad } from "@/src/hooks/useTopPad";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
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
import { TextInput } from "@/src/theme/components/TextInput";
import axiosInstance from "@/src/api/axiosInstance";

function Spinner({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2"
      style={{
        width: size,
        height: size,
        borderColor: color,
        borderTopColor: "transparent",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

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
  const isDark = colors.isDark;

  // High-contrast emerald & gold luxury palette pairing
  const bg = isDark ? "#122A20" : colors.emerald;
  const textColor = isDark ? "#EAD7B5" : colors.champagne;

  return (
    <div
      className="flex items-center justify-center py-2"
      style={{ backgroundColor: bg }}
    >
      <span
        className="px-4 text-center text-[10px] tracking-[0.8px]"
        style={{ color: textColor, fontFamily: "DMSans_400Regular" }}
      >
        Free shipping above {APP_CURRENCY}
        {JEWELERY_MODULE_CONFIG.freeShippingThreshold.toLocaleString("en-IN")} ·
        Hallmarked gold · Try at home available
      </span>
    </div>
  );
}

function Header() {
  const colors = useColors();
  useTopPad();
  const windowWidth = useWindowWidth();
  // Desktop web uses the global JeweleryDesktopNavbar — hide the mobile
  // brand row there so we don't render two headers. Mobile untouched.
  if (windowWidth >= BREAKPOINTS.desktopMin) return null;
  // Narrow phones: icon-only switcher so logo + search + pill fit 360px.
  const compactSwitcher = windowWidth < 400;

  return (
    <div
      className="flex flex-row items-center justify-between border-b px-4 py-5"
      style={{
        backgroundColor: colors.ivory,
        borderBottomColor: colors.midGray,
        borderBottomWidth: 1,
      }}
    >
      <span
        className="text-[18px] tracking-[4px]"
        style={{ color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" }}
      >
        {APP_NAME}
      </span>
      <div
        className={cn(
          "flex flex-row items-center",
          compactSwitcher ? "gap-2.5" : "gap-3",
        )}
      >
        <ModuleSwitcherButton compact={compactSwitcher} />
      </div>
    </div>
  );
}

function BrandPillars() {
  const colors = useColors();
  const pillars = [
    { icon: Award, label: "Hallmark\nCertified" },
    { icon: Wrench, label: "Handcrafted\nin India" },
    { icon: RefreshCw, label: "Free Returns\n30 Days" },
    { icon: House, label: "Try Before\nYou Buy" },
  ];

  return (
    <div
      className="flex flex-row border-y px-3 py-4"
      style={{
        backgroundColor: colors.ivory,
        borderTopColor: colors.gold,
        borderBottomColor: colors.gold,
        borderTopWidth: 1,
        borderBottomWidth: 1,
      }}
    >
      {pillars.map((p) => (
        <div key={p.label} className="flex flex-1 flex-col items-center gap-1.5">
          <p.icon size={16} color={colors.gold} />
          <span
            className="whitespace-pre-line text-center text-[9px] leading-[13px] tracking-[0.5px]"
            style={{ color: colors.ink, fontFamily: "DMSans_400Regular" }}
          >
            {p.label}
          </span>
        </div>
      ))}
    </div>
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
    <div className="flex flex-row items-end justify-between">
      <div>
        {label && (
          <span
            className="mb-1 block text-[9px] tracking-[2px]"
            style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
          >
            {label}
          </span>
        )}
        <h2
          className="text-[26px] leading-[30px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_500Medium_Italic",
          }}
        >
          {title}
        </h2>
      </div>
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="cursor-pointer"
        >
          <span
            className="text-[11px] tracking-[0.5px]"
            style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
          >
            See all
          </span>
        </button>
      )}
    </div>
  );
}

const JEWELERY_COLLECTION_IMAGES: Record<string, string> = {
  jewellery: "https://ik.imagekit.io/k2n57ywshu/categories/jewelry/jewelry_collection_showcase_1789811067982_KRVoN6-Ls6.jpg",
  necklace: "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_pear_ruby_pendant_1789811050387_6l5vvgrn4r.jpg",
  ring: "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_solitaire_diamond_ring_1789811055760_0Iahnr6TDz.jpg",
  earrings: "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_peacock_temple_jhumkas_1789811057899_dLFgtSO4C.jpg",
  bangle: "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_royal_gold_bangles_1789811053311_o1ORm92lY.jpg",
  pendant: "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_laxmi_temple_coin_pendant_1789811062952_VSOBuVmmqn.jpg",
  "bridal-set": "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_royal_kundan_bridal_set_1789811060450_aFO15AgH_J.jpg",
  chain: "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_solid_gold_curb_chain_1789811065544_yPAVEqRfy.jpg",
};

export function resolveJeweleryCollectionImage(c: any): string {
  const slug = (c?.slug || c?.title?.toLowerCase()?.replace(/\s+/g, "-") || "").trim();
  const raw = c?.image || "";
  if (!raw || raw.includes("ethnic") || raw.includes("shirts") || raw.includes("kurtis") || raw.includes("jeans") || raw.includes("kids") || raw.includes("sarees")) {
    return JEWELERY_COLLECTION_IMAGES[slug] || JEWELERY_COLLECTION_IMAGES.jewellery;
  }
  return raw;
}

function FeaturedCollections() {
  const navigate = useNavigate();
  const colors = useColors();
  const { data: cats } = useJeweleryCategories();
  const top: Collection[] = (cats ?? []).slice(0, 3).map((c) => {
    const imgUri = resolveJeweleryCollectionImage(c);
    return {
      id: c._id,
      name: c.title,
      tagline: "",
      mood: "",
      pieceCount: 0,
      image: imgUri ? { uri: imgUri } : null,
    };
  });
  if (!top.length) return null;
  return (
    <div className="p-5" style={{ backgroundColor: colors.ivory }}>
      <SectionHeader label="CURATED FOR YOU"
        title="Our Collections"
        onSeeAll={() => goTo(navigate, "/jewelery/collections" as any)}
      />
      <div className="mt-4 flex h-[320px] flex-row gap-2.5">
        <CollectionCard collection={top[0]} large style={{ flex: 1 }} />
        {top.length > 1 && (
          <div className="flex flex-[0.6] flex-col gap-2.5">
            {top.slice(1).map((c) => (
              <CollectionCard key={c.id} collection={c} style={{ flex: 1 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewArrivals() {
  const navigate = useNavigate();
  const colors = useColors();
  const isDark = colors.isDark;
  const { data: newItems = [], isLoading } = useJeweleryNewArrivals(8);
  if (!isLoading && newItems.length === 0) return null;
  return (
    <div
      className="p-5"
      style={{ backgroundColor: isDark ? colors.card : colors.champagne }}
    >
      <SectionHeader label="JUST IN"
        title="New Arrivals"
        onSeeAll={() => goTo(navigate, "/jewelery/collections" as any)}
      />
      {isLoading ? (
        <div className="mt-4 flex justify-center">
          <Spinner color={colors.gold} />
        </div>
      ) : (
        <div className="mt-4 flex flex-row gap-3 overflow-x-auto pb-1 pr-5">
          {newItems.map((i) => (
            <div key={i.id} className="w-[164px] shrink-0">
              <ProductCard product={i} style={{ width: 164, marginRight: 12 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OccasionsSection() {
  const colors = useColors();
  return (
    <div className="p-5" style={{ backgroundColor: colors.ivory }}>
      <SectionHeader label="FIND YOUR MOMENT" title="Shop by Occasion" />
      <div className="mt-4 flex flex-row flex-wrap gap-2">
        {occasions.map((o) => (
          <button
            key={o.id}
            type="button"
            className="flex cursor-pointer flex-row items-center gap-1.5 rounded-full border px-3 py-2 transition-colors active:opacity-80"
            style={{
              borderColor: colors.gold,
              borderWidth: 1,
              backgroundColor: "transparent",
            }}
            onClick={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <o.icon size={13} color={colors.gold} />
            <span
              className="text-[13px]"
              style={{
                color: colors.ink,
                fontFamily: "CormorantGaramond_500Medium_Italic",
              }}
            >
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HeritageSection() {
  const colors = useColors();
  return (
    <div style={{ backgroundColor: colors.pearl }}>
      <div className="flex flex-col gap-3 p-6">
        <span
          className="text-[9px] tracking-[2px]"
          style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
        >
          OUR CRAFT
        </span>
        <h2
          className="text-[26px] leading-[32px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_400Regular_Italic",
          }}
        >
          Every piece holds the memory of hands that shaped it.
        </h2>
        <p
          className="text-[13px] leading-[22px]"
          style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
        >
          We work with master karigar families across Jaipur, Thrissur, and
          Banarasi ateliers — artisans whose craft has been passed down for
          generations.
          <br />
          <br />
          Our jewellery is not manufactured. It is made.
        </p>
        <button type="button" className="cursor-pointer self-start" onClick={() => {}}>
          <span
            className="text-xs tracking-[1px]"
            style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
          >
            Read Our Story →
          </span>
        </button>
      </div>
    </div>
  );
}

function BestsellerSection() {
  const navigate = useNavigate();
  const colors = useColors();
  const { data: bestsellers = [], isLoading } = useJeweleryBestsellers(6);
  if (!isLoading && bestsellers.length === 0) return null;
  return (
    <div className="p-5" style={{ backgroundColor: colors.ivory }}>
      <SectionHeader label="MOST LOVED"
        title="Bestsellers"
        onSeeAll={() => goTo(navigate, "/jewelery/collections" as any)}
      />
      <div className="mt-4 flex flex-row flex-wrap justify-between gap-2">
        {isLoading ? (
          <div className="flex flex-1 justify-center py-6">
            <Spinner color={colors.gold} />
          </div>
        ) : (
          bestsellers.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </div>
  );
}

function FestiveCampaign() {
  const navigate = useNavigate();
  const colors = useColors();
  return (
    <div
      className="flex flex-col items-center gap-3.5 p-8"
      style={{ backgroundColor: colors.emerald }}
    >
      <span
        className="text-base"
        style={{
          color: colors.gold,
          fontFamily: "CormorantGaramond_400Regular_Italic",
        }}
      >
        This festive season —
      </span>
      <h2
        className="text-center text-[36px] leading-[42px]"
        style={{
          color: "#F7F3EC",
          fontFamily: "CormorantGaramond_300Light_Italic",
        }}
      >
        Adorn yourself in your own story.
      </h2>
      <p
        className="text-center text-[13px] leading-5"
        style={{ color: "rgba(247,243,236,0.7)", fontFamily: "DMSans_300Light" }}
      >
        Curated festive edits in gold, kundan, and polki. New drops every
        fortnight. Gifting boxes available.
      </p>
      <button
        type="button"
        className="mt-1.5 cursor-pointer rounded-[1px] px-7 py-3.5 transition-opacity active:opacity-90"
        style={{ backgroundColor: colors.gold }}
        onClick={() => goTo(navigate, "/jewelery/collections" as any)}
      >
        <span
          className="text-xs tracking-[1.5px]"
          style={{ color: colors.onBrand, fontFamily: "DMSans_500Medium" }}
        >
          Shop Festive Edit
        </span>
      </button>
    </div>
  );
}

function TestimonialsSection() {
  const colors = useColors();
  return (
    <div className="p-5" style={{ backgroundColor: colors.pearl }}>
      <SectionHeader label="LOVED & TRUSTED" title="What They Say" />
      <div className="mt-4">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="mb-3 flex flex-col gap-2 rounded-[2px] p-4"
            style={{ backgroundColor: colors.ivory }}
          >
            <div className="flex flex-row gap-0.5">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} size={12} color={colors.gold} />
              ))}
            </div>
            <p
              className="text-[15px] leading-6"
              style={{
                color: colors.ink,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              }}
            >
              &ldquo;{t.text}&rdquo;
            </p>
            <span
              className="text-[11px] tracking-[0.3px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              — {t.name}, {t.city} · Verified Purchase
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GiftingSection() {
  const colors = useColors();
  return (
    <div
      className="flex flex-col gap-4 p-5"
      style={{ backgroundColor: colors.champagne }}
    >
      <span
        className="text-[9px] tracking-[2px]"
        style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
      >
        GIVE SOMETHING FOREVER
      </span>
      <h2
        className="text-[26px] leading-[32px]"
        style={{
          color: colors.ink,
          fontFamily: "CormorantGaramond_500Medium_Italic",
        }}
      >
        Because some gifts outlive the occasion.
      </h2>
      <p
        className="text-[13px] leading-[22px]"
        style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
      >
        Every {APP_NAME} order ships in our signature ivory and gold gift box —
        complimentary. Add a handwritten note. Make it unforgettable.
      </p>
      <button
        type="button"
        className="cursor-pointer self-start rounded-[1px] border px-5 py-3 transition-colors active:opacity-80"
        style={{
          borderColor: colors.gold,
          borderWidth: 1,
          backgroundColor: "transparent",
        }}
      >
        <span
          className="text-xs tracking-[1px]"
          style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
        >
          Explore Gifting →
        </span>
      </button>
    </div>
  );
}

function NewsletterSection() {
  const colors = useColors();
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  const subscribe = async () => {
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus("loading");
    setMessage("");
    try {
      const res = await axiosInstance.post("/newsletter/subscribe", {
        email: value,
        vertical: "JEWELERY",
        source: "jewelery-home-newsletter",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus("done");
      setMessage(
        res?.data?.message || "You're on the list. Welcome to the Circle!",
      );
      setEmail("");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus("error");
      setMessage(
        err?.response?.data?.message ||
          "Couldn't subscribe right now. Please try again.",
      );
    }
  };

  return (
    <div
      className="flex flex-col items-center gap-4 p-5"
      style={{ backgroundColor: colors.ivory }}
    >
      <h2
        className="text-center text-[30px] leading-[36px]"
        style={{
          color: colors.ink,
          fontFamily: "CormorantGaramond_400Regular_Italic",
        }}
      >
        Be the first to know.
      </h2>
      <p
        className="max-w-[280px] text-center text-[13px] leading-5"
        style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
      >
        New collections. Artisan stories. Early access. Festive drops.
      </p>
      {status === "done" ? (
        <div
          className="mt-3 flex w-full flex-col items-center rounded-[2px] border p-4"
          style={{
            borderColor: colors.gold,
            borderWidth: 1,
            backgroundColor: colors.champagne,
          }}
        >
          <span
            className="text-center text-sm leading-5"
            style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
          >
            {message || "You're on the list. Welcome to the Circle!"}
          </span>
        </div>
      ) : (
        <>
          <div
            className="mt-3 flex w-full flex-row items-center overflow-hidden rounded-[2px] border"
            style={{
              borderColor:
                status === "error"
                  ? "#dc2626"
                  : focused
                    ? colors.gold
                    : colors.midGray,
              borderWidth: 1,
            }}
          >
            <TextInput value={email}
              bare
              onChangeText={(t) => {
                setEmail(t);
                if (status === "error") setStatus("idle");
              }}
              placeholder="Your email"
              placeholderTextColor={colors.warmGray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={subscribe}
              editable={status !== "loading"}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              focusBorderColor={colors.gold}
              containerStyle={{ marginBottom: 0, flex: 1 }}
              inputContainerStyle={{
                borderWidth: 0,
                backgroundColor: "transparent",
                paddingHorizontal: 14,
                paddingVertical: 0,
                borderRadius: 0,
              }}
              style={{
                fontSize: 14,
                color: colors.ink,
                fontFamily: "DMSans_400Regular",
                minHeight: 48,
              }}
            />
            <button
              type="button"
              className={cn(
                "cursor-pointer px-4 py-3",
                status === "loading" && "opacity-70",
              )}
              style={{ backgroundColor: colors.gold }}
              onClick={subscribe}
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <Spinner size={14} color={colors.onBrand} />
              ) : (
                <span
                  className="text-[11px] tracking-[0.5px]"
                  style={{ color: colors.onBrand, fontFamily: "DMSans_500Medium" }}
                >
                  Join the Circle
                </span>
              )}
            </button>
          </div>
          {status === "error" && message ? (
            <span
              className="mt-2 text-xs"
              style={{ color: "#dc2626", fontFamily: "DMSans_400Regular" }}
            >
              {message}
            </span>
          ) : null}
        </>
      )}
      <span
        className="text-[10px] tracking-[0.5px]"
        style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
      >
        No spam. Only gold.
      </span>
    </div>
  );
}

export default function JeweleryHomeScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { data: heroItems } = useJeweleryBestsellers(4);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["jewelery-categories"] });
  }, [queryClient]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: colors.ivory }}
    >
      <Header />
      <div className="overflow-y-auto" style={{ paddingBottom: 110 }}>
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
      </div>
    </div>
  );
}
