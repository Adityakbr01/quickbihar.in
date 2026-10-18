export type ModuleId = "clothing" | "jewelery";

export interface AppModule {
  id: ModuleId;
  name: string;
  label: string;
  iconName: string;
  badgeColor: string;
  route: string;
}

export const APP_MODULES: AppModule[] = [
  {
    id: "clothing",
    name: "Clothing",
    label: "Clothing",
    iconName: "shirt-outline",
    badgeColor: "#4F46E5",
    route: "/(tabs)/clothing/home",
  },
  {
    id: "jewelery",
    name: "Jewelry",
    label: "Jewelry",
    iconName: "sparkles-outline",
    badgeColor: "#D97706",
    route: "/jewelery",
  },
];
