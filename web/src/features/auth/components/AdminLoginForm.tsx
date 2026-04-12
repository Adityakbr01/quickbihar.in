"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Loader2 } from "lucide-react";
import { loginSchema, LoginValues } from "../schemas/auth.schema";
import { useLogin } from "../hooks/useAuth";

export default function AdminLoginForm() {
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: LoginValues) {
    login(values);
  }

  return (
    <Card className="w-full max-w-sm py-16 bg-white/5 relative z-10">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight text-white">Admin Portal</CardTitle>
        <CardDescription className="text-gray-400">
          Enter your credentials to manage QuickBihar.in
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
                        placeholder="admin@quickbihar.in"
                        {...field}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 transition-colors"
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
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 transition-all"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : "Sign In to Dashboard"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
