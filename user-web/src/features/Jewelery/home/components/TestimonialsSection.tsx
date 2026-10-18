import { Star } from "lucide-react";
import React from "react";
import { SectionHeader } from "./SectionHeader";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

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

/**
 * Customer testimonials section.
 *
 * NOTE: This section is intentionally NOT rendered by JeweleryHomeScreen —
 * it is parked until real verified reviews exist (see the matching note in
 * JeweleryHomeScreen). It is extracted here as a standalone component so it
 * can be wired up later without touching the screen. Do not delete.
 */
export function TestimonialsSection() {
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
              style={{
                color: colors.warmGray,
                fontFamily: "DMSans_400Regular",
              }}
            >
              — {t.name}, {t.city} · Verified Purchase
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
