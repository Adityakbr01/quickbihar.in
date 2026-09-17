import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { toast } from "@/lib/toast";
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
import AuthLayout from "@/features/auth/components/AuthLayout";

/**
 * Page that lets a password-authenticated user link a Google account.
 * After linking, they can sign in with either method.
 */
export default function LinkGooglePage() {
  useEffect(() => { document.title = "Link Google Account | QuickBihar Dashboard"; }, []);

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const hasHydrated = useAuthHydrated();
  const { mutate, isPending } = useLinkGoogle();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      navigate("/admin/login", { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

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
    <AuthLayout>
      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {done ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </span>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Link Google account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {user?.email
              ? `Link a Google account that uses ${user.email} to enable one-tap sign-in.`
              : "Link a Google account for one-tap sign-in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {done ? (
            <div className="grid gap-4 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Google account linked. You can now sign in with either method.
              </p>
              <Link
                to="/admin/dashboard"
                className="text-sm font-medium text-primary hover:underline"
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
              <div className="rounded-xl border border-border bg-muted p-3 text-xs leading-relaxed text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p>
                  For your protection, the Google account email must match
                  {user?.email ? ` ${user.email}` : " your account email"}.
                </p>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <Link
                  to="/admin/dashboard"
                  className="font-medium text-primary hover:underline"
                >
                  Back to dashboard
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
