// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase will auto-exchange the token from the URL hash
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    // Also check if user is already in a session (e.g., page refresh)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setSessionReady(true);
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => {
        router.push("/customer/dashboard");
        router.refresh();
      }, 2000);
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
          <h1 className="text-2xl font-bold text-slate-900">Password Updated!</h1>
          <p className="text-slate-600 mt-2">
            Your password has been reset successfully. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
            HM
          </div>
          <span className="text-lg font-semibold text-slate-900">Hygiene Maids</span>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set new password</h1>
          </div>
          <p className="text-sm text-slate-500">
            Choose a strong password to secure your account.
          </p>
        </div>

        {!sessionReady ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Verifying your reset link...</p>
            <p className="text-xs text-slate-400 mt-2">
              If this takes too long, your link may have expired.{" "}
              <Link href="/auth/forgot-password" className="text-teal-600 hover:underline">
                Request a new one
              </Link>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
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
              {/* Password strength indicators */}
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= i * 3
                        ? password.length >= 12
                          ? "bg-emerald-500"
                          : password.length >= 8
                          ? "bg-teal-500"
                          : "bg-amber-500"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {password.length === 0
                  ? "Enter a password"
                  : password.length < 6
                  ? "Too short"
                  : password.length < 8
                  ? "Fair"
                  : password.length < 12
                  ? "Good"
                  : "Strong"}
              </p>
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
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2 font-medium bg-teal-600 hover:bg-teal-700"
              disabled={loading || password !== confirmPassword}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Update Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
