import type { LucideIcon } from "lucide-react";
import { Shirt, Sparkles } from "lucide-react";
export type ModuleId = "clothing" | "jewelery";

export interface AppModule {
  id: ModuleId;
  name: string;
  label: string;
  iconName: LucideIcon;
  badgeColor: string;
  route: string;
}

export const APP_MODULES: AppModule[] = [
  {
    id: "clothing",
    name: "Clothing",
    label: "Clothing",
    iconName: Shirt,
    badgeColor: "#4F46E5",
    route: "/clothing/home",
  },
  {
    id: "jewelery",
    name: "Jewelry",
    label: "Jewelry",
    iconName: Sparkles,
    badgeColor: "#D97706",
    route: "/jewelery",
  },
];
