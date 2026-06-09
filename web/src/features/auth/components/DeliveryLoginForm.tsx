"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bike, Loader2, Lock, Mail } from "lucide-react";
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
    <Card className="relative z-10 w-full max-w-sm border-white/10 bg-white/5 py-12">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
          <Bike className="h-5 w-5" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-white">Delivery Login</CardTitle>
        <CardDescription className="text-gray-400">
          Sign in to manage assigned QuickBihar deliveries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        {...field}
                        placeholder={DELIVERY_DEMO_EMAIL}
                        className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                      />
                    </div>
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
                  <FormLabel className="text-gray-200">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        {...field}
                        type="password"
                        placeholder={DELIVERY_DEMO_PASSWORD}
                        className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                      />
                    </div>
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
