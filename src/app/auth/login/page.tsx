// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, CheckCircle2, CalendarDays, CreditCard, Star, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { fetchUserRole, getDashboardPath } from "@/lib/auth-helpers";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const errorParam = searchParams.get("error");

  // Show error from URL params (e.g., from auth callback)
  useEffect(() => {
    if (errorParam === "auth_callback_error") {
      toast.error("Authentication failed. Please try signing in again.");
    }
  }, [errorParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("Invalid email or password. Please try again.");
        } else if (error.message === "Email not confirmed") {
          toast.error("Please check your email and verify your account before signing in.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Welcome back!");

      // Step 2: Fetch role from profiles table for accurate routing
      try {
        const roleData = await fetchUserRole();
        const role = roleData.role;

        // If admin tries to log in here, redirect them to admin login
        if (role === "admin") {
          toast.info("Please use the admin login page.");
          router.push("/admin");
          router.refresh();
          return;
        }

        // Role-based redirect
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push(getDashboardPath(role));
        }
        router.refresh();
      } catch {
        // Fallback: use user_metadata if API fails
        const role = data.user?.user_metadata?.role;
        if (redirectTo) {
          router.push(redirectTo);
        } else if (role === "provider" || role === "cleaner") {
          router.push("/cleaner/dashboard");
        } else {
          router.push("/customer/dashboard");
        }
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[oklch(0.35_0.12_170)] to-[oklch(0.25_0.08_200)] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
                HM
              </div>
              <span className="text-lg font-semibold">Hygiene Maids</span>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              Your cleaning,<br />
              managed effortlessly.
            </h2>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Sign in to manage your bookings, view your schedule, and keep your home sparkling clean.
            </p>

            <div className="space-y-4 text-white/60 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-teal-300" />
                </div>
                <span>Manage and reschedule your bookings</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-teal-300" />
                </div>
                <span>View payment history and download invoices</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-teal-300" />
                </div>
                <span>Leave reviews and earn referral rewards</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-teal-300" />
                </div>
                <span>Track your cleaning schedule at a glance</span>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-xs">
            &copy; 2026 Hygiene Maids. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
              HM
            </div>
            <span className="text-lg font-semibold">Hygiene Maids</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your account to continue
            </p>
          </div>

          {errorParam && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">
                {errorParam === "auth_callback_error"
                  ? "Authentication failed. Please try signing in again."
                  : "An error occurred. Please try again."}
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-teal-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2 font-medium bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-teal-600 hover:underline font-medium">
                Create one
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Cleaning professional?{" "}
              <Link href="/auth/signup" className="text-teal-600 hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
