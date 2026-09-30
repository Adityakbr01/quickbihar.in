import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { QueryProvider } from "@/src/provider/QueryProvider";
import { ThemeProvider, useTheme } from "@/src/theme/Provider/ThemeProvider";
import SocketListenerMount from "@/src/provider/SocketListenerMount";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useModuleStore } from "@/src/store/useModuleStore";
import { APP_MODULES } from "@/src/constants/modules";
import { ErrorBoundary } from "@/src/components/common/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import SeoRouter from "@/src/seo/SeoRouter";
import { normalizeExpoPathForWeb } from "@/src/utils/navigation";
import DesktopNavbar from "@/src/features/clothing/home/components/DesktopNavbar";
import JeweleryDesktopNavbar from "@/src/features/Jewelery/components/JeweleryDesktopNavbar";
import BottomTabBar from "@/src/components/common/BottomTabBar";

// Core shopping home — eager (first paint).
import ClothingHomeScreen from "@/src/features/clothing/home/screens/HomeScreen";

// Everything else — route-split (lazy) so the entry chunk stays lean.
// React Query dedupes data; SeoRouter + prerender cover SEO for these routes.
const ClothingSearchScreen = lazy(
  () => import("@/src/features/clothing/search/screens/ClothingSearchScreen"),
);
const FoodHomeScreen = lazy(() =>
  import("@/src/features/Food/screens/FoodHomeScreen").then((m) => ({
    default: m.FoodHomeScreen,
  })),
);
const TopSellingScreen = lazy(
  () => import("@/src/features/clothing/home/screens/TopSellingScreen"),
);
const MallDetailScreen = lazy(
  () => import("@/src/features/clothing/home/screens/MallDetailScreen"),
);
const MallsListScreen = lazy(
  () => import("@/src/features/clothing/home/screens/MallsListScreen"),
);
const ProductDetailScreen = lazy(
  () => import("@/src/features/clothing/product/screen/ProductDetailScreen"),
);
const CategoryDetailScreen = lazy(
  () => import("@/src/features/common/category/screens/CategoryDetailScreen"),
);
const AccountMain = lazy(
  () => import("@/src/features/common/account/screens/AccountMain"),
);
const AddressFormScreen = lazy(
  () => import("@/src/features/common/address/screen/AddressFormScreen"),
);
const SavedAddressesScreen = lazy(
  () => import("@/src/features/common/address/screen/SavedAddressesScreen"),
);
const CartContent = lazy(
  () => import("@/src/features/common/cart/screen/CartContent"),
);
const CheckoutScreen = lazy(
  () => import("@/src/features/common/order/screen/CheckoutScreen"),
);
const OrderDetailScreen = lazy(
  () => import("@/src/features/common/order/screen/OrderDetailScreen"),
);
const OrderListScreen = lazy(
  () => import("@/src/features/common/order/screen/OrderListScreen"),
);
const OrderSuccessScreen = lazy(
  () => import("@/src/features/common/order/screen/OrderSuccessScreen"),
);
const WishlistScreen = lazy(
  () => import("@/src/features/common/wishlist/screen/WishlistScreen"),
);
const NotificationScreen = lazy(
  () => import("@/src/features/common/notification/screens/NotificationScreen"),
);
const RiderWorkspaceScreen = lazy(
  () => import("@/src/features/Delivery/screens/RiderWorkspaceScreen"),
);
const OnboardingScreen = lazy(
  () => import("@/src/features/Onboarding/screens/OnboardingScreen"),
);
const AuthScreen = lazy(
  () => import("@/src/features/common/auth/screen/auth.screen"),
);

// Jewelery Screens (lazy — separate module bundle)
const JeweleryHomeScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryHomeScreen"),
);
const JeweleryCartScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryCartScreen"),
);
const JeweleryCheckoutScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryCheckoutScreen"),
);
const JeweleryCollectionsScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryCollectionsScreen"),
);
const JeweleryProductDetailScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryProductDetailScreen"),
);
const JeweleryAccountScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryAccountScreen"),
);
const JeweleryAddressFormScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryAddressFormScreen"),
);
const JeweleryAddressesScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryAddressesScreen"),
);
const JeweleryOrderDetailScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryOrderDetailScreen"),
);
const JeweleryOrderSuccessScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryOrderSuccessScreen"),
);
const JeweleryOrdersScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryOrdersScreen"),
);
const JewelerySearchScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JewelerySearchScreen"),
);
const JeweleryTryOnScreen = lazy(() =>
  import("@/src/features/Jewelery/screens/JeweleryTryOnScreen").then((m) => ({
    default: m.JeweleryTryOnScreen,
  })),
);
const JeweleryWishlistScreen = lazy(
  () => import("@/src/features/Jewelery/screens/JeweleryWishlistScreen"),
);

/** Minimal route-loading fallback (lazy chunks). */
function RouteLoader() {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      style={{ minHeight: "50vh" }}
    >
      <span
        className="block h-9 w-9 animate-spin rounded-full border-[3px] border-t-transparent"
        style={{ borderColor: "#E11D4830", borderTopColor: "#E11D48" }}
      />
    </div>
  );
}

function MallDetailRoute() {
  const { slug } = useParams<{ slug: string }>();
  return <MallDetailScreen id={slug || ""} />;
}

function ProductDetailRoute() {
  const { id } = useParams<{ id: string }>();
  return <ProductDetailScreen id={id || ""} />;
}

function CategoryDetailRoute() {
  const { slug } = useParams<{ slug: string }>();
  return <CategoryDetailScreen slug={slug || ""} />;
}

function RootRedirect() {
  const { currentModuleId } = useModuleStore();
  const activeModule =
    APP_MODULES.find((m) => m.id === currentModuleId) || APP_MODULES[0];
  // Normalize: handles legacy "/(tabs)/clothing/home" left over from mobile.
  const targetRoute = normalizeExpoPathForWeb(activeModule.route);
  return <Navigate to={targetRoute} replace />;
}

function LegacyRedirect() {
  // Handles pasted/bookmarked Expo URLs (e.g. "/(tabs)/clothing/home",
  // "/jewelery/(tabs)/cart") and any in-app goTo/replaceTo to those paths.
  // Preserves the destination instead of bouncing to the module home.
  // Without this, react-router hits "*" and blank-loops.
  const location = useLocation();
  const fullPath = `${location.pathname}${location.search}${location.hash}`;
  const cleanPath = normalizeExpoPathForWeb(fullPath);
  // If normalization didn't change anything and it's still unknown,
  // fall back to the module home instead of looping.
  if (cleanPath === fullPath) {
    return <RootRedirect />;
  }
  return <Navigate to={cleanPath} replace />;
}

function ThemedChrome() {
  const theme = useTheme();

  useEffect(() => {
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
  }, [theme]);

  return null;
}

function MainLayout() {
  const theme = useTheme();
  const location = useLocation();
  const isJeweleryRoute =
    location.pathname === "/jewelery" ||
    location.pathname.startsWith("/jewelery/");
  // Auth flows are full-screen tasks — no navbars behind them.
  const isAuthRoute =
    location.pathname === "/auth" ||
    location.pathname.startsWith("/auth/") ||
    location.pathname.startsWith("/jewelery/auth/");

  return (
    <div
      style={{ flex: 1, backgroundColor: theme.background, minHeight: "100vh" }}
    >
      <ThemedChrome />
      <SeoRouter />
      <SocketListenerMount />
      <>
        {isAuthRoute ? null : isJeweleryRoute ? (
          <JeweleryDesktopNavbar />
        ) : (
          <DesktopNavbar />
        )}
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            {/* Legacy Expo URLs: "/(tabs)/clothing/home" -> "/clothing/home" */}
            <Route
              path="/(tabs)/clothing/home"
              element={<ClothingHomeScreen />}
            />
            <Route
              path="/(tabs)/clothing/search"
              element={<ClothingSearchScreen />}
            />
            <Route path="/(tabs)/clothing/cart" element={<CartContent />} />
            <Route path="/(tabs)/clothing/account" element={<AccountMain />} />
            <Route
              path="/(tabs)/clothing/checkout"
              element={<CheckoutScreen />}
            />
            <Route
              path="/(tabs)/clothing/rider"
              element={<RiderWorkspaceScreen />}
            />

            {/* Clothing & Main Routes */}
            <Route path="/clothing/home" element={<ClothingHomeScreen />} />
            <Route path="/clothing/search" element={<ClothingSearchScreen />} />
            <Route path="/clothing/cart" element={<CartContent />} />
            <Route path="/clothing/account" element={<AccountMain />} />
            <Route path="/clothing/checkout" element={<CheckoutScreen />} />
            <Route path="/clothing/rider" element={<RiderWorkspaceScreen />} />

            <Route path="/top-selling" element={<TopSellingScreen />} />
            <Route path="/malls" element={<MallsListScreen />} />
            <Route path="/mall/:slug" element={<MallDetailRoute />} />
            <Route path="/product/:id" element={<ProductDetailRoute />} />
            <Route path="/category/:slug" element={<CategoryDetailRoute />} />

            {/* Account Routes */}
            <Route path="/account" element={<AccountMain />} />
            <Route
              path="/account/addresses"
              element={<SavedAddressesScreen />}
            />
            <Route
              path="/account/address-form"
              element={<AddressFormScreen />}
            />
            <Route path="/account/orders" element={<OrderListScreen />} />
            <Route path="/account/wishlist" element={<WishlistScreen />} />
            <Route
              path="/account/notifications"
              element={<NotificationScreen />}
            />

            {/* Orders */}
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/order-detail" element={<OrderDetailScreen />} />
            <Route path="/order-success" element={<OrderSuccessScreen />} />

            {/* Other Modules */}
            <Route path="/food" element={<FoodHomeScreen />} />
            <Route path="/rider" element={<RiderWorkspaceScreen />} />
            <Route path="/Onboarding" element={<OnboardingScreen />} />

            {/* Auth (common sign-in used by every module's guest flows) */}
            <Route path="/auth" element={<AuthScreen />} />

            {/* Jewelery Module */}
            <Route path="/jewelery" element={<JeweleryHomeScreen />} />
            <Route
              path="/jewelery/collections"
              element={<JeweleryCollectionsScreen />}
            />
            <Route path="/jewelery/cart" element={<JeweleryCartScreen />} />
            <Route
              path="/jewelery/checkout"
              element={<JeweleryCheckoutScreen />}
            />
            <Route path="/jewelery/try-on" element={<JeweleryTryOnScreen />} />
            <Route
              path="/jewelery/account"
              element={<JeweleryAccountScreen />}
            />
            {/* Mobile profile tab renders the same account screen */}
            <Route
              path="/jewelery/profile"
              element={<JeweleryAccountScreen />}
            />
            <Route
              path="/jewelery/addresses"
              element={<JeweleryAddressesScreen />}
            />
            <Route
              path="/jewelery/address-form"
              element={<JeweleryAddressFormScreen />}
            />
            <Route path="/jewelery/orders" element={<JeweleryOrdersScreen />} />
            <Route
              path="/jewelery/order-detail"
              element={<JeweleryOrderDetailScreen />}
            />
            {/* Mobile dynamic route /jewelery/orders/[id] */}
            <Route
              path="/jewelery/orders/:id"
              element={<JeweleryOrderDetailScreen />}
            />
            <Route
              path="/jewelery/order-success"
              element={<JeweleryOrderSuccessScreen />}
            />
            <Route
              path="/jewelery/wishlist"
              element={<JeweleryWishlistScreen />}
            />
            <Route path="/jewelery/search" element={<JewelerySearchScreen />} />
            <Route
              path="/jewelery/notifications"
              element={<NotificationScreen />}
            />
            <Route path="/jewelery/auth/sign-in" element={<AuthScreen />} />
            <Route path="/jewelery/auth/sign-up" element={<AuthScreen />} />
            <Route
              path="/jewelery/product/:id"
              element={<JeweleryProductDetailScreen />}
            />

            {/* Catch-all: normalize legacy Expo paths, else module home */}
            <Route path="*" element={<LegacyRedirect />} />
          </Routes>
        </Suspense>
        <BottomTabBar />
      </>
    </div>
  );
}

export default MainLayout;
