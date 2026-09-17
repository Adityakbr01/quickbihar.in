import { useEffect, useState } from "react"
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, MailCheck } from "lucide-react";
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
import AuthLayout from "@/features/auth/components/AuthLayout";

export default function ForgotPasswordPage() {
  useEffect(() => { document.title = "Forgot Password | QuickBihar Dashboard"; }, []);
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
    <AuthLayout>
      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {sent ? <MailCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </span>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Forgot password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {sent
              ? "Check your email for a reset link."
              : "Enter your email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="grid gap-4 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                If an account exists for that email, you&apos;ll get a reset link
                shortly. The link works on both the web dashboard and the mobile
                app, and expires in 15 minutes.
              </p>
              <Link
                to="/admin/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
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
                          placeholder="you@example.com"
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
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Remembered it?{" "}
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
