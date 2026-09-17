import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/lib/toast";

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
import { Bike, Loader2, ShieldCheck, Store } from "lucide-react";
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
import { useAuthHydrated } from "../hooks/useAuthHydrated";
import { isAdmin, isSeller, isRider } from "@/lib/rbac";
import GoogleSignInButton from "./GoogleSignInButton";

type ThemeKey = "admin" | "seller" | "delivery";

interface RoleLoginFormProps {
  theme: ThemeKey;
}

interface ThemeConfig {
  badge: string;
  icon: typeof Store;
  title: string;
  description: string;
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
    badge: "Admin Portal",
    icon: ShieldCheck,
    title: "Welcome back",
    description: "Sign in to manage the platform",
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
    badge: "Seller Portal",
    icon: Store,
    title: "Welcome back",
    description: "Sign in to your seller account",
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
    badge: "Rider Portal",
    icon: Bike,
    title: "Welcome back",
    description: "Sign in to your rider account",
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
 * All styling uses src/index.css theme tokens (no per-role hardcoded
 * colors) so the next-themes light/dark toggle works everywhere.
 *
 * Mobile-OTP sign-in has been removed in Phase 7 — see auth.service.ts.
 */
export default function RoleLoginForm({ theme }: RoleLoginFormProps) {
  const config = THEME[theme];
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useAuthHydrated();
  const BadgeIcon = config.icon;

  useEffect(() => {
    if (hasHydrated && isAuthenticated && config.isAuthorized(user)) {
      navigate(config.alreadyAuthedRedirect, { replace: true });
    }
  }, [hasHydrated, isAuthenticated, user, navigate, config]);

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
    <Card className="border-border bg-card shadow-lg">
      <CardHeader className="space-y-3 text-center">
        <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-wider text-primary uppercase">
          <BadgeIcon className="h-3.5 w-3.5" />
          {config.badge}
        </span>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          {config.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
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
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              or use email
            </span>
          </div>
        </div>

        {/* Email + Password (secondary) */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={config.emailPlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-muted-foreground">Password</FormLabel>
                    <Link
                      to="/auth/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full font-semibold"
              size="lg"
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
          <div className="text-center text-sm text-muted-foreground">
            {config.registerLabel}{" "}
            <Link
              to={config.registerHref}
              className="font-medium text-primary hover:underline"
            >
              Register here
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
