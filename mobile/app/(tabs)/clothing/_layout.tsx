import { getRoleName, RIDER_ROLE_ALIAS, RoleEnum, useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  DeliveryTruck01Icon,
  Home01Icon,
  Search01Icon,
  ShoppingCartCheck01Icon,
  User02FreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
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
  const roleName = getRoleName(user?.role);
  const isRider = roleName === RoleEnum.DELIVERY || roleName === RIDER_ROLE_ALIAS;

  const isWeb = Platform.OS === "web";

  const ALL_TABS = [
    ...TABS_CONFIG,
    {
      name: "rider",
      label: "Rider",
      icon: DeliveryTruck01Icon,
      hidden: !isRider,
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
          height: isWeb ? 70 : Platform.OS === "ios" ? 88 : 90,
          paddingBottom: isWeb ? 10 : Platform.OS === "ios" ? 28 : 35,
          paddingTop: 10,
          // Responsive Web Styles
          ...(isWeb && {
            position: "absolute",
            bottom: 0,
            left: "0%",
            right: "0%",
            alignSelf: "center",
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
            href: "hidden" in tab && tab.hidden ? null : undefined,
            tabBarLabel: tab.label,
            tabBarIcon: ({ size, focused }) => {
              const IconComp = HugeiconsIcon as any;
              return (
                <IconComp
                  icon={tab.icon}
                  size={size}
                  color={focused ? theme.iconColor : theme.tertiaryText}
                  strokeWidth={focused ? 2 : 1.5}
                />
              );
            },
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
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
