import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
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
 * "Set a password" screen for Google-only accounts. Once they set a
 * password they can also sign in with email + password.
 */
export default function SetPasswordPage() {
  useEffect(() => { document.title = "Set Password | QuickBihar Dashboard"; }, []);

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const hasHydrated = useAuthHydrated();
  const { mutate, isPending } = useSetPassword();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      navigate("/admin/login", { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirmPassword: "", currentPassword: "" },
  });

  const onSubmit = (values: SetPasswordValues) => {
    mutate(values, { onSuccess: () => setDone(true) });
  };

  if (!hasHydrated) {
    return null;
  }

  return (
    <AuthLayout>
      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {done ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </span>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Add a password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {user?.email
              ? `Set a password for ${user.email} so you can sign in without Google.`
              : "Set a password as a backup sign-in method."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="grid gap-4 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Password set. You can now sign in with either Google or your
                email and password.
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
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          {...field}
                        />
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
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Repeat password"
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
