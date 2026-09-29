import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryProvider } from "@/src/provider/QueryProvider";
import { ThemeProvider, useTheme } from "@/src/theme/Provider/ThemeProvider";
import { SheetProvider } from "@/src/components/common/BottomSheet";
import { SocketListenerProvider } from "@/src/provider/SocketListenerProvider";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useModuleStore } from "@/src/store/useModuleStore";
import { APP_MODULES } from "@/src/constants/modules";
import { ErrorBoundary } from "@/src/components/common/ErrorBoundary";
import { normalizeExpoPathForWeb } from "@/src/utils/navigation";
import { View } from "@/components/primitives";
import DesktopNavbar from "@/src/features/clothing/home/components/DesktopNavbar";
import JeweleryDesktopNavbar from "@/src/features/Jewelery/components/JeweleryDesktopNavbar";
import BottomTabBar from "@/src/components/common/BottomTabBar";

// Import Screens
import ClothingHomeScreen from "@/src/features/clothing/home/screens/HomeScreen";
import ClothingSearchScreen from "@/src/features/clothing/search/screens/ClothingSearchScreen";
import { FoodHomeScreen } from "@/src/features/Food/screens/FoodHomeScreen";
import TopSellingScreen from "@/src/features/clothing/home/screens/TopSellingScreen";
import MallDetailScreen from "@/src/features/clothing/home/screens/MallDetailScreen";
import ProductDetailScreen from "@/src/features/clothing/product/screen/ProductDetailScreen";
import CategoryDetailScreen from "@/src/features/common/category/screens/CategoryDetailScreen";
import AccountMain from "@/src/features/common/account/screens/AccountMain";
import AddressFormScreen from "@/src/features/common/address/screen/AddressFormScreen";
import SavedAddressesScreen from "@/src/features/common/address/screen/SavedAddressesScreen";
import CartContent from "@/src/features/common/cart/screen/CartContent";
import CheckoutScreen from "@/src/features/common/order/screen/CheckoutScreen";
import OrderDetailScreen from "@/src/features/common/order/screen/OrderDetailScreen";
import OrderListScreen from "@/src/features/common/order/screen/OrderListScreen";
import OrderSuccessScreen from "@/src/features/common/order/screen/OrderSuccessScreen";
import WishlistScreen from "@/src/features/common/wishlist/screen/WishlistScreen";
import NotificationScreen from "@/src/features/common/notification/screens/NotificationScreen";
import RiderWorkspaceScreen from "@/src/features/Delivery/screens/RiderWorkspaceScreen";
import OnboardingScreen from "@/src/features/Onboarding/screens/OnboardingScreen";
import { AuthScreen } from "@/src/features/common/auth";

// Jewelery Screens
import JeweleryHomeScreen from "@/src/features/Jewelery/screens/JeweleryHomeScreen";
import JeweleryCartScreen from "@/src/features/Jewelery/screens/JeweleryCartScreen";
import JeweleryCheckoutScreen from "@/src/features/Jewelery/screens/JeweleryCheckoutScreen";
import JeweleryCollectionsScreen from "@/src/features/Jewelery/screens/JeweleryCollectionsScreen";
import JeweleryProductDetailScreen from "@/src/features/Jewelery/screens/JeweleryProductDetailScreen";
import JeweleryAccountScreen from "@/src/features/Jewelery/screens/JeweleryAccountScreen";
import JeweleryAddressFormScreen from "@/src/features/Jewelery/screens/JeweleryAddressFormScreen";
import JeweleryAddressesScreen from "@/src/features/Jewelery/screens/JeweleryAddressesScreen";
import JeweleryOrderDetailScreen from "@/src/features/Jewelery/screens/JeweleryOrderDetailScreen";
import JeweleryOrderSuccessScreen from "@/src/features/Jewelery/screens/JeweleryOrderSuccessScreen";
import JeweleryOrdersScreen from "@/src/features/Jewelery/screens/JeweleryOrdersScreen";
import JewelerySearchScreen from "@/src/features/Jewelery/screens/JewelerySearchScreen";
import { JeweleryTryOnScreen } from "@/src/features/Jewelery/screens/JeweleryTryOnScreen";
import JeweleryWishlistScreen from "@/src/features/Jewelery/screens/JeweleryWishlistScreen";

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
      <SocketListenerProvider>
        {isAuthRoute ? null : isJeweleryRoute ? (
          <JeweleryDesktopNavbar />
        ) : (
          <DesktopNavbar />
        )}
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
          <Route path="/mall/:slug" element={<MallDetailRoute />} />
          <Route path="/product/:id" element={<ProductDetailRoute />} />
          <Route path="/category/:slug" element={<CategoryDetailRoute />} />

          {/* Account Routes */}
          <Route path="/account" element={<AccountMain />} />
          <Route path="/account/addresses" element={<SavedAddressesScreen />} />
          <Route path="/account/address-form" element={<AddressFormScreen />} />
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
          <Route path="/jewelery/account" element={<JeweleryAccountScreen />} />
          {/* Mobile profile tab renders the same account screen */}
          <Route path="/jewelery/profile" element={<JeweleryAccountScreen />} />
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
        <BottomTabBar />
      </SocketListenerProvider>
    </div>
  );
}

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth().catch(console.warn);
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <QueryProvider>
            <ThemeProvider>
              <SheetProvider>
                <MainLayout />
              </SheetProvider>
            </ThemeProvider>
          </QueryProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
