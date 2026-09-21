import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Sheet, SheetHeader, useSheet } from "@/src/components/common/BottomSheet";
import {
  JEWELERY_MODULE_CONFIG,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_NUMBER,
} from "@/src/constants";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

type Channel = "whatsapp" | "email";

interface Faq {
  q: string;
  a: string;
}

// Mock help topics shown in the sheet. Tapping one redirects to the
// channel the user picked, with the question pre-filled.
const FAQS: Faq[] = [
  {
    q: "Is your gold BIS hallmarked?",
    a: "Yes — every gold piece is BIS hallmarked. The HUID number is on the invoice and the product tag.",
  },
  {
    q: "How do I find my ring/bangle size?",
    a: "Use our size guide on any product page, or message us and we'll help you measure at home.",
  },
  {
    q: "What is your return policy?",
    a: `Easy ${JEWELERY_MODULE_CONFIG.returnPolicyDays}-day returns on unworn pieces with tags and invoice intact.`,
  },
  {
    q: "How long does delivery take?",
    a: "Made-to-order pieces ship in 3–5 days. You'll get live tracking on your order.",
  },
  {
    q: "Can I exchange for a different size?",
    a: "Yes, size exchanges are free within the return window. Start one from My Orders.",
  },
  {
    q: "How is the gold rate applied?",
    a: "Prices follow the day's live gold rate at checkout — the invoice locks your rate.",
  },
  {
    q: "Where is my order?",
    a: "Open My Orders → Track for live rider location and delivery OTP.",
  },
];

interface HelpSupportSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpSupportSheet: React.FC<HelpSupportSheetProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const sheet = useSheet();
  const [channel, setChannel] = useState<Channel | null>(null);

  // Imperative present/dismiss from the parent `visible` prop.
  useEffect(() => {
    if (visible) {
      setChannel(null);
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [visible, sheet]);

  const openChannel = (faq: Faq) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = `Hi QuickBihar Jewellery support! I need help with: ${faq.q}`;
    const url =
      channel === "email"
        ? `mailto:${JEWELERY_MODULE_CONFIG.supportEmail}?subject=${encodeURIComponent(`Help: ${faq.q}`)}&body=${encodeURIComponent(`${message}\n\nOrder ID (if any): `)}`
        : `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    onClose();
    Linking.openURL(url).catch(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    });
  };

  const pickChannel = (c: Channel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChannel(c);
  };

  return (
    <Sheet
      ref={sheet}
      onDidDismiss={onClose}
      backgroundColor={colors.ivory}
    >
      <SheetHeader
        title="Help & Support"
        subtitle={
          channel === null
            ? "How would you like to reach us?"
            : channel === "whatsapp"
              ? "Pick a topic — we'll open WhatsApp with it filled in"
              : `Pick a topic — we'll draft an email to ${JEWELERY_MODULE_CONFIG.supportEmail}`
        }
        onClose={onClose}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {channel === null ? (
          <>
            <Pressable
              style={[s.channelCard, { backgroundColor: colors.pearl, borderColor: colors.midGray }]}
              onPress={() => pickChannel("whatsapp")}
            >
              <View style={[s.channelIcon, { backgroundColor: "#25D366" }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.channelTitle, { color: colors.ink }]}>
                  WhatsApp
                </Text>
                <Text style={[s.channelSub, { color: colors.warmGray }]}>
                  {SUPPORT_WHATSAPP_NUMBER.replace(
                    /(\d{2})(\d{5})(\d{5})/,
                    "+91 $2 $3",
                  )} · replies within minutes
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.gold} />
            </Pressable>

            <Pressable
              style={[s.channelCard, { backgroundColor: colors.pearl, borderColor: colors.midGray }]}
              onPress={() => pickChannel("email")}
            >
              <View style={[s.channelIcon, { backgroundColor: colors.gold }]}>
                <Feather name="mail" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.channelTitle, { color: colors.ink }]}>
                  Email
                </Text>
                <Text style={[s.channelSub, { color: colors.warmGray }]}>
                  {SUPPORT_EMAIL} · replies within a day
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.gold} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={s.backRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setChannel(null);
              }}
              hitSlop={8}
            >
              <Feather name="chevron-left" size={16} color={colors.gold} />
              <Text style={[s.backText, { color: colors.gold }]}>
                {channel === "whatsapp" ? "WhatsApp" : "Email"} · change
              </Text>
            </Pressable>

            {FAQS.map((faq) => (
              <Pressable
                key={faq.q}
                style={[s.faqCard, { backgroundColor: colors.pearl, borderColor: colors.midGray }]}
                onPress={() => openChannel(faq)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.faqQ, { color: colors.ink }]}>
                    {faq.q}
                  </Text>
                  <Text style={[s.faqA, { color: colors.warmGray }]}>
                    {faq.a}
                  </Text>
                  <Text style={[s.faqCta, { color: colors.gold }]}>
                    {channel === "whatsapp" ? "Ask on WhatsApp →" : "Ask over Email →"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
};

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  channelTitle: {
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
  },
  channelSub: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  faqCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  faqQ: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  faqA: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 4,
    lineHeight: 17,
  },
  faqCta: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    marginTop: 8,
  },
});
