import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  setPasswordSchema,
  SetPasswordValues,
} from "@/features/auth/schemas/auth.schema";
import { useSetPassword } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated";
import AuthLayout from "@/features/auth/components/AuthLayout";

/**
 * Standalone set/change password page (same action as the dashboard
 * PasswordDialog). No current password is asked — the session is the proof
 * of identity. Password text stays visible with an eye toggle to hide it.
 */
export default function SetPasswordPage() {
  useEffect(() => { document.title = "Password & Security | QuickBihar Dashboard"; }, []);

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const hasHydrated = useAuthHydrated();
  const { mutate, isPending } = useSetPassword();
  const [done, setDone] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      navigate("/admin/login", { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (values: SetPasswordValues) => {
    mutate(values, { onSuccess: () => setDone(true) });
  };

  if (!hasHydrated) {
    return null;
  }

  const eyeButton = (
    <button
      type="button"
      aria-label={show ? "Hide password" : "Show password"}
      onClick={() => setShow(!show)}
      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <AuthLayout>
      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {done ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </span>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {user?.hasPassword ? "Change password" : "Add a password"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {user?.email
              ? `For ${user.email}. No current password needed — you're already signed in.`
              : "No current password needed — you're already signed in."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="grid gap-4 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {user?.hasPassword
                  ? "Password changed. Use your new password next time you sign in."
                  : "Password set. You can now sign in with either Google or your email and password."}
              </p>
              <Button
                onClick={() => navigate(-1)}
                className="w-full font-semibold"
                size="lg"
              >
                Done
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">New password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={show ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            className="pr-10"
                            {...field}
                          />
                          {eyeButton}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">
                        Confirm new password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={show ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Repeat password"
                            className="pr-10"
                            {...field}
                          />
                          {eyeButton}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full font-semibold"
                  size="lg"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save password"
                  )}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <Link
                    to="/admin/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Back to sign in
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
