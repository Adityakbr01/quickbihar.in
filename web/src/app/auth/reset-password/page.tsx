"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
  resetPasswordSchema,
  ResetPasswordValues,
} from "@/features/auth/schemas/auth.schema";
import { useResetPassword } from "@/features/auth/hooks/useAuth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { mutate, isPending } = useResetPassword();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const onSubmit = (values: ResetPasswordValues) => {
    if (!token) return;
    mutate(values);
  };

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] p-4">
        <Card className="w-full max-w-sm border-none bg-transparent">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Invalid reset link</CardTitle>
            <CardDescription className="text-gray-400">
              The reset link is missing or malformed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-emerald-300 hover:text-emerald-200"
            >
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] p-4">
      <Card className="relative z-10 w-full max-w-sm border-none bg-transparent py-4 shadow-none">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
            Set a new password
          </CardTitle>
          <CardDescription className="text-gray-400">
            Choose a strong password you don't reuse anywhere else.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                    Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
