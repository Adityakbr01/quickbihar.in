import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  Dress05Icon,
  Agreement02Icon,
  CookieIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

const { width } = Dimensions.get("window");

const CHOICE_ITEMS = [
  {
    id: "clothing",
    label: "Fashion",
    description: "Explore the latest trends",
    route: "/(tabs)/clothing",
    colors: ["#2874f0", "#56adff"],
    icon: Dress05Icon,
  },
  {
    id: "jewelry",
    label: "Jewelry",
    description: "Luxury and Elegance",
    route: "/(tabs)/jewelry",
    colors: ["#B8860B", "#DAA520"],
    icon: Agreement02Icon,
  },
  {
    id: "food",
    label: "Grocery",
    description: "Fresh and Organic",
    route: "/(tabs)/food",
    colors: ["#1b5e20", "#4caf50"],
    icon: CookieIcon,
  },
];

export default function ChoiceScreen() {
  const { isInitialized } = useAuthStore();
  const router = useRouter();

  if (!isInitialized) {
    return null;
  }

  const handleSelect = (route: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(route);
  };

  return (
    <SafeViewWrapper>
      <View style={styles.container}>
        <LinearGradient
          colors={["#f8f9fa", "#e9ecef"]}
          style={styles.background}
        />

        <View style={styles.header}>
          <Text style={styles.title}>Quick Bihar</Text>
          <Text style={styles.subtitle}>Where would you like to go today?</Text>
        </View>

        <View style={styles.grid}>
          {CHOICE_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => handleSelect(item.route)}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={item.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.iconContainer}>
                  <HugeiconsIcon icon={item.icon} size={40} color="#fff" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.label}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeViewWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#1a1a1a",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  grid: {
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 24,
  },
  card: {
    height: 140,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  cardDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
});
