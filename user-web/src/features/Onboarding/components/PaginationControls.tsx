import { ArrowRight, X } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import React from "react";
import { cn } from "@/src/lib/utils";

export interface PaginationControlsProps {
  currentStep: number;
  totalSteps: number;
  onSkip: () => void;
  onNext: () => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentStep,
  totalSteps,
  onSkip,
  onNext,
}) => {
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="mt-10 flex flex-row items-center justify-between">
      {/* Skip */}
      <button
        type="button"
        aria-label="Skip onboarding"
        onClick={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSkip();
        }}
        className="flex h-[50px] w-[50px] items-center justify-center rounded-full active:opacity-70"
        style={{ backgroundColor: "rgba(56, 56, 59, 0.6)" }}
      >
        <X size={20} color="rgba(255,255,255,0.75)" />
      </button>

      {/* Dots */}
      <div className="flex flex-row items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === currentStep
                ? "w-7 bg-[#1f2937]"
                : "w-2 bg-[rgba(180,180,190,0.6)]",
            )}
          />
        ))}
      </div>

      {/* Next */}
      <button
        type="button"
        aria-label={isLast ? "Finish onboarding" : "Next step"}
        onClick={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onNext();
        }}
        className={cn(
          "flex h-14 items-center justify-center rounded-full bg-[#0f172a] active:opacity-85",
          isLast ? "w-[110px] bg-black" : "w-14",
        )}
      >
        {isLast ? (
          <span className="block truncate text-lg font-semibold text-white">Finish</span>
        ) : (
          <ArrowRight size={24} color="#fff" />
        )}
      </button>
    </div>
  );
};
