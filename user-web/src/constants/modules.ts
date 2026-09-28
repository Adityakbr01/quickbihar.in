import type { LucideIcon } from "lucide-react";
import { Shirt, Sparkles, Sandwich } from "lucide-react";
export type ModuleId = "clothing" | "food" | "jewelery";

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
  {
    id: "food",
    name: "Food",
    label: "Food",
    iconName: Sandwich,
    badgeColor: "#E11D48",
    route: "/food",
  },
];
