import { ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { WhatsappIcon } from "@/src/components/common/BrandIcons";
import * as Haptics from "@/lib/haptics";
import React, { useEffect, useState } from "react";
import { cn } from "@/src/lib/utils";

import {
  JEWELERY_MODULE_CONFIG,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_INTL,
} from "@/src/constants";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { AppSheet } from "@/src/components/common/AppSheet";

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
  const [channel, setChannel] = useState<Channel | null>(null);

  // Reset channel selection each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setChannel(null);
    }
  }, [visible]);

  const openChannel = (faq: Faq) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = `Hi QuickBihar Jewellery support! I need help with: ${faq.q}`;
    // wa.me needs the full international number (91 + mobile) — a bare
    // national number is rejected by WhatsApp as invalid.
    const url =
      channel === "email"
        ? `mailto:${JEWELERY_MODULE_CONFIG.supportEmail}?subject=${encodeURIComponent(`Help: ${faq.q}`)}&body=${encodeURIComponent(`${message}\n\nOrder ID (if any): `)}`
        : `https://wa.me/${SUPPORT_WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
    onClose();
    try {
      window.open(url, "_blank", "noopener");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const pickChannel = (c: Channel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChannel(c);
  };

  const subtitle =
    channel === null
      ? "How would you like to reach us?"
      : channel === "whatsapp"
        ? "Pick a topic — we'll open WhatsApp with it filled in"
        : `Pick a topic — we'll draft an email to ${JEWELERY_MODULE_CONFIG.supportEmail}`;

  return (
    <AppSheet
      visible={visible}
      onClose={onClose}
      title="Help & Support"
      subtitle={subtitle}
      label="Help & Support"
    >
          <div className="flex flex-col gap-3 px-5 pb-6">
            {channel === null ? (
              <>
                <button
                  type="button"
                  onClick={() => pickChannel("whatsapp")}
                  className="flex cursor-pointer flex-row items-center gap-3 rounded-[2px] border-[0.5px] p-4 text-left"
                  style={{ backgroundColor: colors.pearl, borderColor: colors.midGray }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "#25D366" }}
                  >
                    <WhatsappIcon size={20} color="#fff" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className="text-base"
                      style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                    >
                      WhatsApp
                    </span>
                    <span
                      className="mt-0.5 text-xs"
                      style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
                    >
                      {SUPPORT_WHATSAPP_DISPLAY} · replies within minutes
                    </span>
                  </span>
                  <ChevronRight size={18} color={colors.gold} />
                </button>

                <button
                  type="button"
                  onClick={() => pickChannel("email")}
                  className="flex cursor-pointer flex-row items-center gap-3 rounded-[2px] border-[0.5px] p-4 text-left"
                  style={{ backgroundColor: colors.pearl, borderColor: colors.midGray }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.gold }}
                  >
                    <Mail size={18} color="#fff" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className="text-base"
                      style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                    >
                      Email
                    </span>
                    <span
                      className="mt-0.5 text-xs"
                      style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
                    >
                      {SUPPORT_EMAIL} · replies within a day
                    </span>
                  </span>
                  <ChevronRight size={18} color={colors.gold} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setChannel(null);
                  }}
                  className="flex cursor-pointer flex-row items-center gap-0.5 self-start py-1"
                >
                  <ChevronLeft size={16} color={colors.gold} />
                  <span
                    className="text-[13px]"
                    style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                  >
                    {channel === "whatsapp" ? "WhatsApp" : "Email"} · change
                  </span>
                </button>

                {FAQS.map((faq) => (
                  <button
                    key={faq.q}
                    type="button"
                    onClick={() => openChannel(faq)}
                    className={cn("cursor-pointer rounded-[2px] border-[0.5px] p-3.5 text-left")}
                    style={{ backgroundColor: colors.pearl, borderColor: colors.midGray }}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span
                        className="text-sm"
                        style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                      >
                        {faq.q}
                      </span>
                      <span
                        className="mt-1 text-xs leading-[17px]"
                        style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
                      >
                        {faq.a}
                      </span>
                      <span
                        className="mt-2 text-xs"
                        style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                      >
                        {channel === "whatsapp" ? "Ask on WhatsApp →" : "Ask over Email →"}
                      </span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
    </AppSheet>
  );
};
