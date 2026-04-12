import React from "react";
import { OnboardingStepData } from "./types";
import { ShoppingBagIcon, CreditCardIcon, TruckIcon } from "./AnimatedIcons";

export const steps: OnboardingStepData[] = [
  {
    id: 1,
    caption: "Looking for the drop?",
    title: "Find your\nnext obsession",
    bottomTitle: "Ready to upgrade your fit?",
    bottomDesc: "Shop exclusive collections,\ncurated just for you.",
    icon: <ShoppingBagIcon />,
  },
  {
    id: 2,
    caption: "Hate long checkouts?",
    title: "Swipe to\nsecure",
    bottomTitle: "Secure the bag instantly.",
    bottomDesc: "One-tap payments with\nabsolutely zero friction.",
    icon: <CreditCardIcon />,
  },
  {
    id: 3,
    caption: "Want it tomorrow?",
    title: "Track in\nreal-time",
    bottomTitle: "Lightning fast delivery.",
    bottomDesc: "Watch your order move from\nour warehouse to your hands.",
    icon: <TruckIcon />,
  },
];
