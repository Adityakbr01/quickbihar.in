"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
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
  requestResetSchema,
  RequestResetValues,
} from "@/features/auth/schemas/auth.schema";
import { useRequestPasswordReset } from "@/features/auth/hooks/useAuth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { mutate, isPending } = useRequestPasswordReset();

  const form = useForm<RequestResetValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: RequestResetValues) => {
    mutate(values, {
      onSuccess: () => setSent(true),
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] p-4">
      <Card className="relative z-10 w-full max-w-sm border-none bg-transparent py-4 shadow-none">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
            Forgot password
          </CardTitle>
          <CardDescription className="text-gray-400">
            {sent
              ? "Check your email for a reset link."
              : "Enter your email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="grid gap-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <MailCheck className="h-6 w-6" />
              </div>
              <p className="text-sm text-gray-300">
                If an account exists for that email, you'll get a reset link
                shortly. The link works on both the web dashboard and the mobile
                app, and expires in 15 minutes.
              </p>
              <Link
                href="/admin/login"
                className="text-sm text-emerald-300 hover:text-emerald-200"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
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
                          placeholder="you@example.com"
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
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
                <div className="text-center text-sm text-gray-400">
                  Remembered it?{" "}
                  <Link
                    href="/admin/login"
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
