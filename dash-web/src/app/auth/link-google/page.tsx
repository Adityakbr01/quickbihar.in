"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated";
import { useLinkGoogle } from "@/features/auth/hooks/useAuth";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";

/**
 * Page that lets a password-authenticated user link a Google account.
 * After linking, they can sign in with either method.
 */
export default function LinkGooglePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const hasHydrated = useAuthHydrated();
  const { mutate, isPending } = useLinkGoogle();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  const handleGoogleIdToken = (idToken: string) => {
    mutate(
      { idToken },
      {
        onSuccess: () => setDone(true),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  if (!hasHydrated) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] p-4">
      <Card className="relative z-10 w-full max-w-sm border-none bg-transparent py-4 shadow-none">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
            Link Google account
          </CardTitle>
          <CardDescription className="text-gray-400">
            {user?.email
              ? `Link a Google account that uses ${user.email} to enable one-tap sign-in.`
              : "Link a Google account for one-tap sign-in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {done ? (
            <div className="grid gap-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm text-gray-300">
                Google account linked. You can now sign in with either method.
              </p>
              <Link
                href="/admin/dashboard"
                className="text-sm text-emerald-300 hover:text-emerald-200"
              >
                Go to dashboard →
              </Link>
            </div>
          ) : (
            <>
              <GoogleSignInButton
                onSuccess={handleGoogleIdToken}
                onError={(msg) => toast.error(msg)}
                disabled={isPending}
                label="Link Google account"
              />
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-gray-400 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <p>
                  For your protection, the Google account email must match
                  {user?.email ? ` ${user.email}` : " your account email"}.
                </p>
              </div>
              <div className="text-center text-sm text-gray-400">
                <Link
                  href="/admin/dashboard"
                  className="text-emerald-300 hover:text-emerald-200"
                >
                  Back to dashboard
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
