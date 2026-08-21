"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Loader2, ArrowLeft } from "lucide-react";
import { loginSchema, LoginValues } from "../schemas/auth.schema";
import { useLogin, useAdminVerifyOTP } from "../hooks/useAuth";
import { requestOtpRequest } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import { isAdmin } from "@/lib/rbac";

export default function AdminLoginForm() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [tab, setTab] = useState<"otp" | "password">("otp");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (!persistApi || persistApi.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    return persistApi.onFinishHydration(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && isAdmin(user)) {
      router.replace("/admin/dashboard");
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  const { mutate: login, isPending: isLoggingIn } = useLogin();
  const { mutate: verifyOtp, isPending: isVerifying } = useAdminVerifyOTP();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onPasswordSubmit(values: LoginValues) {
    login(values);
  }

  const handleGetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpSending(true);
    try {
      await requestOtpRequest({ target: cleanPhone, isRegistration: false });
      toast.success("OTP sent to your mobile number.");
      setOtpSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("OTP must be 6 digits.");
      return;
    }
    verifyOtp({ target: phone, otp });
  };

  return (
    <Card className="relative z-10 w-full max-w-sm border-none bg-transparent py-4 shadow-none">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-extrabold tracking-tight text-white">Admin Portal</CardTitle>
        <CardDescription className="text-gray-400">
          Sign in to manage the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-lg mb-6">
          <button
            type="button"
            disabled={otpSent}
            onClick={() => setTab("otp")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === "otp"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-400 hover:text-white disabled:opacity-50"
            }`}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            disabled={otpSent}
            onClick={() => setTab("password")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === "password"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-400 hover:text-white disabled:opacity-50"
            }`}
          >
            Email & Password
          </button>
        </div>

        {tab === "otp" ? (
          /* Mobile OTP Login Flow */
          !otpSent ? (
            <form onSubmit={handleGetOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Mobile Number</label>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={otpSending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 transition-all"
              >
                {otpSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Get OTP Code"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-300">Enter OTP Code</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change number
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="6-digit verification code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 text-center tracking-widest text-lg transition-colors"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 transition-all"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>
            </form>
          )
        ) : (
          /* Email & Password Flow */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email or Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin@quickbihar.in"
                        {...field}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 transition-colors"
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
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 transition-colors"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 transition-all"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}