import React from "react";
import { OnboardingStepData } from "./types";
import { PaginationControls, PaginationControlsProps } from "./PaginationControls";
import { EdgeInsets } from "@/src/hooks/useSafeAreaInsets";

export interface OnboardingSlideProps extends PaginationControlsProps {
  step: OnboardingStepData;
  topStyle: React.CSSProperties;
  iconStyle: React.CSSProperties;
  bottomStyle: React.CSSProperties;
  insets: EdgeInsets;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  step,
  topStyle,
  iconStyle,
  bottomStyle,
  insets,
  ...paginationProps
}) => {
  return (
    <>
      {/* Top section */}
      <div
        className="z-10 px-9"
        style={{ paddingTop: insets.top + 40, ...topStyle }}
      >
        <p
          className="mb-0.5 text-base font-light text-white/60"
          style={{ letterSpacing: 0.4 }}
        >
          {step.caption}
        </p>
        {/* <ArrowDown size={18} color="rgba(255,255,255,0.6)" style={{ marginVertical: 8 }} /> */}
        <h1
          className="text-[38px] font-medium whitespace-pre-line text-white"
          style={{ lineHeight: "38px", letterSpacing: -0.5 }}
        >
          {step.title}
        </h1>
      </div>

      {/* Icon section */}
      <div className="z-10 flex flex-1 items-center justify-center">
        <div style={iconStyle}>{step.icon}</div>
      </div>

      {/* Bottom section (fades out during swipe) */}
      <div className="z-10 px-9" style={bottomStyle}>
        <h2
          className="mb-2.5 text-[28px] font-medium whitespace-pre-line text-[#111827]"
          style={{ lineHeight: "34px", letterSpacing: 0.9 }}
        >
          {step.bottomTitle}
        </h2>
        <p
          className="text-lg font-light whitespace-pre-line text-[#374151]"
          style={{ lineHeight: "22px" }}
        >
          {step.bottomDesc}
        </p>
      </div>

      {/* Controls (static layout anchored to bottom) */}
      <div className="z-10 px-9" style={{ paddingBottom: insets.bottom + 24 }}>
        <PaginationControls {...paginationProps} />
      </div>
    </>
  );
};
