"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useDeliveryLogin } from "../hooks/useAuth";
import { loginSchema, LoginValues } from "../schemas/auth.schema";

const DELIVERY_DEMO_EMAIL = "delivery@example.com";
const DELIVERY_DEMO_PASSWORD = "password123";

export default function DeliveryLoginForm() {
  const { mutate: login, isPending } = useDeliveryLogin();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DELIVERY_DEMO_EMAIL,
      password: DELIVERY_DEMO_PASSWORD,
    },
  });

  function onSubmit(values: LoginValues) {
    login(values);
  }

  return (
    <Card className="relative z-10 w-full max-w-sm border-none bg-transparent py-4 shadow-none">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-extrabold tracking-tight text-white">Delivery Login</CardTitle>
        <CardDescription className="text-gray-400">
          Sign in to your rider account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={DELIVERY_DEMO_EMAIL}
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500"
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
                  <FormLabel className="text-gray-300">Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder={DELIVERY_DEMO_PASSWORD}
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-cyan-600 py-6 font-semibold text-white hover:bg-cyan-700"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : "Open Delivery Panel"}
            </Button>
            <div className="text-center text-sm text-gray-400">
              New delivery partner?{" "}
              <Link href="/delivery/register" className="text-cyan-300 hover:text-cyan-200">
                Register here
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
