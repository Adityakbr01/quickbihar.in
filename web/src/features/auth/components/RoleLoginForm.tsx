"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { loginSchema, LoginValues } from "../schemas/auth.schema";
import {
  useLogin,
  useSellerLogin,
  useDeliveryLogin,
  useAdminGoogleAuth,
  useSellerGoogleAuth,
  useDeliveryGoogleAuth,
} from "../hooks/useAuth";
import { useAuthStore } from "../store/authStore";
import { isAdmin, isSeller, isRider } from "@/lib/rbac";
import GoogleSignInButton from "./GoogleSignInButton";

type ThemeKey = "admin" | "seller" | "delivery";

interface RoleLoginFormProps {
  theme: ThemeKey;
}

interface ThemeConfig {
  title: string;
  description: string;
  accentBg: string;
  accentBgHover: string;
  accentFocus: string;
  accentText: string;
  accentTextHover: string;
  registerHref: string;
  registerLabel: string;
  passwordCta: string;
  passwordLabel: string;
  emailPlaceholder: string;
  redirectTo: string;
  alreadyAuthedRedirect: string;
  isAuthorized: (user: any) => boolean;
}

const THEME: Record<ThemeKey, ThemeConfig> = {
  admin: {
    title: "Admin Portal",
    description: "Sign in to manage the platform",
    accentBg: "bg-blue-600",
    accentBgHover: "hover:bg-blue-700",
    accentFocus: "focus:border-blue-500",
    accentText: "text-blue-300",
    accentTextHover: "hover:text-blue-200",
    registerHref: "/admin/login",
    registerLabel: "",
    passwordCta: "Sign In to Dashboard",
    passwordLabel: "Authenticating...",
    emailPlaceholder: "admin@quickbihar.in",
    redirectTo: "/admin/dashboard",
    alreadyAuthedRedirect: "/admin/dashboard",
    isAuthorized: isAdmin,
  },
  seller: {
    title: "Seller Login",
    description: "Sign in to your seller account",
    accentBg: "bg-emerald-600",
    accentBgHover: "hover:bg-emerald-700",
    accentFocus: "focus:border-emerald-500",
    accentText: "text-emerald-300",
    accentTextHover: "hover:text-emerald-200",
    registerHref: "/seller/register",
    registerLabel: "New seller?",
    passwordCta: "Open Seller Dashboard",
    passwordLabel: "Signing in...",
    emailPlaceholder: "seller@example.com",
    redirectTo: "/seller/dashboard",
    alreadyAuthedRedirect: "/seller/dashboard",
    isAuthorized: isSeller,
  },
  delivery: {
    title: "Delivery Login",
    description: "Sign in to your rider account",
    accentBg: "bg-cyan-600",
    accentBgHover: "hover:bg-cyan-700",
    accentFocus: "focus:border-cyan-500",
    accentText: "text-cyan-300",
    accentTextHover: "hover:text-cyan-200",
    registerHref: "/delivery/register",
    registerLabel: "New delivery partner?",
    passwordCta: "Open Delivery Panel",
    passwordLabel: "Signing in...",
    emailPlaceholder: "rider@example.com",
    redirectTo: "/delivery/dashboard",
    alreadyAuthedRedirect: "/delivery/dashboard",
    isAuthorized: isRider,
  },
};

/**
 * Shared role-based sign-in screen.
 *
 * UX:
 *   1. Google button first (primary sign-in, no password needed)
 *   2. "or use email" divider
 *   3. Email + password form (secondary, mostly for admins and seeded accounts)
 *   4. Forgot-password link + register link (when applicable)
 *
 * Mobile-OTP sign-in has been removed in Phase 7 — see auth.service.ts.
 */
export default function RoleLoginForm({ theme }: RoleLoginFormProps) {
  const config = THEME[theme];
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (!persistApi || persistApi.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    return persistApi.onFinishHydration(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && config.isAuthorized(user)) {
      router.replace(config.alreadyAuthedRedirect);
    }
  }, [hasHydrated, isAuthenticated, user, router, config]);

  // Pick the right hooks for this role.
  const { mutate: login, isPending: isLoggingIn } =
    theme === "admin"
      ? useLogin()
      : theme === "seller"
        ? useSellerLogin()
        : useDeliveryLogin();
  const { mutate: googleAuth, isPending: isGoogleAuthing } =
    theme === "admin"
      ? useAdminGoogleAuth()
      : theme === "seller"
        ? useSellerGoogleAuth()
        : useDeliveryGoogleAuth();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onPasswordSubmit(values: LoginValues) {
    login(values);
  }

  const handleGoogleIdToken = (idToken: string) => {
    googleAuth({ idToken });
  };

  const handleGoogleError = (message: string) => {
    toast.error(message);
  };

  return (
    <Card className="relative z-10 w-full max-w-sm border-none bg-transparent py-4 shadow-none">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
          {config.title}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Google (primary) */}
        <GoogleSignInButton
          onSuccess={handleGoogleIdToken}
          onError={handleGoogleError}
          disabled={isGoogleAuthing || isLoggingIn}
          label={
            isGoogleAuthing
              ? "Signing in with Google..."
              : isLoggingIn
                ? "Signing you in..."
                : "Continue with Google"
          }
        />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0e0e0e] px-2 text-gray-500">
              or use email
            </span>
          </div>
        </div>

        {/* Email + Password (secondary) */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onPasswordSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={config.emailPlaceholder}
                      {...field}
                      className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 ${config.accentFocus} transition-colors`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-gray-300">Password</FormLabel>
                    <Link
                      href="/auth/forgot-password"
                      className={`text-xs ${config.accentText} ${config.accentTextHover}`}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...field}
                      className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 ${config.accentFocus} transition-colors`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className={`w-full ${config.accentBg} ${config.accentBgHover} text-white font-semibold py-6 transition-all`}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {config.passwordLabel}
                </>
              ) : (
                config.passwordCta
              )}
            </Button>
          </form>
        </Form>

        {config.registerLabel && (
          <div className="text-center text-sm text-gray-400">
            {config.registerLabel}{" "}
            <Link
              href={config.registerHref}
              className={`${config.accentText} ${config.accentTextHover}`}
            >
              Register here
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
