import { useAuthStore } from "@/src/features/auth/store/authStore";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  DashboardCircleSettingsIcon,
  Home01Icon,
  Search01Icon,
  ShoppingCartCheck01Icon,
  User02FreeIcons
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform } from "react-native";

const TABS_CONFIG = [
  {
    name: "home",
    label: "Home",
    icon: Home01Icon,
  },
  {
    name: "search",
    label: "Search",
    icon: Search01Icon,
  },
  {
    name: "cart",
    label: "Cart",
    icon: ShoppingCartCheck01Icon,
  },
  {
    name: "account",
    label: "Account",
    icon: User02FreeIcons,
  },
];

export default function TabsLayout() {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const isWeb = Platform.OS === 'web';

  const ALL_TABS = [
    ...TABS_CONFIG,
    {
      name: "admin",
      label: "Admin",
      icon: DashboardCircleSettingsIcon,
    },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.iconColor,
        tabBarInactiveTintColor: theme.tertiaryText,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: isWeb ? 4 : -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: isWeb ? 70 : (Platform.OS === 'ios' ? 88 : 90),
          paddingBottom: isWeb ? 10 : (Platform.OS === 'ios' ? 28 : 35),
          paddingTop: 10,
          // Responsive Web Styles
          ...(isWeb && {
            position: 'absolute',
            bottom: 0,
            left: '0%',
            right: '0%',
            borderWidth: 1,
            borderColor: theme.border,
            alignSelf: 'center',
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      {ALL_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            href: tab.name === "admin" && !isAdmin ? null : undefined,
            tabBarLabel: tab.label,
            tabBarIcon: ({ size, focused }) => (
              <HugeiconsIcon
                icon={tab.icon}
                size={size}
                // Explicitly use theme colors to ensure adaptivity
                color={focused ? theme.iconColor : theme.tertiaryText}
                strokeWidth={focused ? 2 : 1.5}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (tab.name === "account" && !isAuthenticated) {
                // Prevent default navigation
                e.preventDefault();
                // Redirect to Auth
                router.push("/auth");
                return;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            },
          }}
        />
      ))}
    </Tabs>
  );
}
