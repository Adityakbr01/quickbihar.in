import { ReactNode } from "react";

export interface OnboardingStepData {
  id: number;
  caption: string;
  title: string;
  bottomTitle: string;
  bottomDesc: string;
  icon: ReactNode;
}