import { Gradient } from "@/src/components/common/Gradient";
import React, { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "@/src/hooks/useSafeAreaInsets";

import { lightTheme } from "@/src/theme/colors";
import { OnboardingSlide, steps } from "../components";
import { AuthScreen } from "../../common/auth";

// ─── Main Screen ─────────────────────────────────────────────

export default function OnboardingScreen({ onDone }: { onDone?: () => void }) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [displayStep, setDisplayStep] = useState(0);
  const [complete, setComplete] = useState(false);

  // Step transition phases (CSS transitions replace reanimated shared values)
  const [phase, setPhase] = useState<"visible" | "leaving" | "entering">("visible");

  const transition = (nextStep: number | null) => {
    // Fade out
    setPhase("leaving");

    setTimeout(() => {
      if (nextStep === null) {
        setComplete(true);
      } else {
        setDisplayStep(nextStep);
        setPhase("entering");
        // Settle into place on the next frame so the CSS transition runs
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setPhase("visible"))
        );
      }
    }, 300);
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      transition(null);
    } else {
      const next = currentStep + 1;
      setCurrentStep(next);
      transition(next);
    }
  };

  const handleSkip = () => {
    setCurrentStep(steps.length - 1);
    transition(null);
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      transition(prev);
    }
  };

  const handleNextRef = useRef(handleNext);
  const handlePrevRef = useRef(handlePrev);

  useEffect(() => {
    handleNextRef.current = handleNext;
    handlePrevRef.current = handlePrev;
  });

  // Minimal left/right swipe via touch events (replaces PanResponder on web).
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < -50) {
        // Swiped left
        handleNextRef.current();
      } else if (dx > 50) {
        // Swiped right
        handlePrevRef.current();
      }
    }
  };

  const animTransition = "opacity 0.3s ease-out, transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)";
  const topStyle: React.CSSProperties = {
    opacity: phase === "visible" ? 1 : 0,
    transform: `translateY(${phase === "leaving" ? -16 : phase === "entering" ? 16 : 0}px)`,
    transition: animTransition,
  };
  const iconStyle: React.CSSProperties = {
    opacity: phase === "visible" ? 1 : 0,
    transform: `scale(${phase === "visible" ? 1 : 0.88})`,
    transition: animTransition,
  };
  const bottomStyle: React.CSSProperties = {
    opacity: phase === "visible" ? 1 : 0,
    transform: `translateY(${phase === "leaving" ? 16 : phase === "entering" ? -16 : 0}px)`,
    transition: animTransition,
  };

  const step = steps[displayStep];

  if (complete) {
    return <AuthScreen />;
  }

  return (
    <div
      className="relative flex min-h-dvh flex-1 flex-col overflow-hidden"
      style={{ backgroundColor: "#020617" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Gradient
        colors={lightTheme.spgradient}
        locations={[0, 0.28, 0.52, 0.78, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      <OnboardingSlide
        step={step}
        topStyle={topStyle}
        iconStyle={iconStyle}
        bottomStyle={bottomStyle}
        insets={insets}
        currentStep={currentStep}
        totalSteps={steps.length}
        onSkip={handleSkip}
        onNext={handleNext}
      />
    </div>
  );
}
