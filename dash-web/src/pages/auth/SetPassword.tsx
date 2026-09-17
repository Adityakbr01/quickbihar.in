import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] p-4">
      <Card className="relative z-10 w-full max-w-sm border-none bg-transparent py-4 shadow-none">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
            Add a password
          </CardTitle>
          <CardDescription className="text-gray-400">
            {user?.email
              ? `Set a password for ${user.email} so you can sign in without Google.`
              : "Set a password as a backup sign-in method."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="grid gap-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="text-sm text-gray-300">
                Password set. You can now sign in with either Google or your
                email and password.
              </p>
              <Button
                onClick={() => navigate(-1)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6"
              >
                Done
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          {...field}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 transition-colors"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">
                        Confirm new password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Repeat password"
                          {...field}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 transition-colors"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 transition-all"
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
                <div className="text-center text-sm text-gray-400">
                  <Link
                    to="/admin/login"
                    className="text-emerald-300 hover:text-emerald-200"
                  >
                    Back to sign in
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
