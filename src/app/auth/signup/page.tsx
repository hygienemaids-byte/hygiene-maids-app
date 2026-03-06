// @ts-nocheck
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingNumber = searchParams.get("booking");
  const redirectTo = searchParams.get("redirect");

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone.replace(/\D/g, ""),
            role: "customer",
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      // 2. Link to existing customer record if booking exists, or create new customer via API
      if (authData.user) {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "link_or_create",
            profileId: authData.user.id,
            email,
            firstName,
            lastName,
            phone: phone.replace(/\D/g, ""),
            bookingNumber: bookingNumber || undefined,
          }),
        });
        if (!res.ok) {
          console.error("Failed to link customer record");
        }
      }

      setSuccess(true);
      toast.success("Account created successfully!");

      // If email confirmation is disabled, redirect immediately
      if (authData.session) {
        setTimeout(() => {
          router.push(redirectTo || "/customer/dashboard");
          router.refresh();
        }, 1500);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Account Created!</h1>
          <p className="text-slate-600 mt-2">
            {bookingNumber
              ? `Your account has been linked to booking #${bookingNumber}. You can now manage your bookings from your dashboard.`
              : "Please check your email to verify your account, then sign in to access your dashboard."}
          </p>
          <div className="mt-6 space-y-3">
            <Link href="/customer/dashboard">
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              your schedule.
            </h2>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Create your account to manage bookings, view your cleaning history, and schedule recurring services.
            </p>
            {bookingNumber && (
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <p className="text-sm text-white/80">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Creating an account will link your booking <strong>#{bookingNumber}</strong> to your profile.
                </p>
              </div>
            )}
            <div className="space-y-3 text-white/60 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>Manage and track all your bookings</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>Reschedule or cancel with one click</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>View payment history and invoices</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>Leave reviews and earn referral rewards</span>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-xs">
            &copy; 2026 Hygiene Maids. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Sign up form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-[420px] py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
              HM
            </div>
            <span className="text-lg font-semibold">Hygiene Maids</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {bookingNumber
                ? `Link your booking #${bookingNumber} to a new account`
                : "Sign up to manage your cleaning services"}
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(469) 555-0123"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
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
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-teal-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="text-center text-[11px] text-muted-foreground mt-4">
            By creating an account, you agree to our{" "}
            <Link href="/terms-of-service" className="underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
