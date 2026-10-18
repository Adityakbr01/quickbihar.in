import React from "react";
import { FAQS } from "@/src/features/Jewelery/data/faqs";
import { SectionHeader } from "../components/SectionHeader";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Jewellery FAQ accordion.
 * Extracted from JeweleryHomeScreen (`FaqSection`).
 * Preserves accordion open/close state, aria-expanded, and copy.
 */
export function FaqSection() {
  const colors = useColors();
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <div className="p-5" style={{ backgroundColor: colors.ivory }}>
      <SectionHeader label="TRUST & CARE" title="Jewellery FAQs" />
      <p
        className="mt-1 text-[13px] leading-5"
        style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
      >
        BIS-hallmarked gold, Cash on Delivery and home delivery in Buxar, Bihar
        — बक्सर में सोने के गहने ऑनलाइन ऑर्डर करें।
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {FAQS.map((f, idx) => {
          const isOpen = open === idx;
          return (
            <div
              key={f.q}
              className="rounded-[2px] border"
              style={{ borderColor: colors.midGray }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span
                  className="text-[13px]"
                  style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                >
                  {f.q}
                </span>
                <span aria-hidden="true" style={{ color: colors.warmGray }}>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen ? (
                <p
                  className="px-4 pb-4 text-[13px] leading-6"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_300Light",
                  }}
                >
                  {f.a}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FaqSection;
