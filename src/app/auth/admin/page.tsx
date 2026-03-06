// @ts-nocheck
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Shield, Lock, BarChart3, Users, Settings } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Verify admin role
      const role = data.user?.user_metadata?.role;
      if (role !== "admin") {
        toast.error("Access denied. This login is for administrators only.");
        await supabase.auth.signOut();
        return;
      }

      toast.success("Welcome back, Admin!");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Admin Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <span className="text-lg font-semibold">Hygiene Maids</span>
                <span className="ml-2 text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                  ADMIN
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              Command Center<br />
              for your business.
            </h2>
            <p className="text-white/60 text-lg max-w-md leading-relaxed">
              Full control over bookings, customers, providers, pricing, and operations. AI-powered insights to grow your cleaning business.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <BarChart3 className="w-5 h-5 text-teal-400 mb-2" />
                <p className="text-sm font-medium">Analytics</p>
                <p className="text-xs text-white/40 mt-1">Revenue, bookings, growth metrics</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Users className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-sm font-medium">Team Management</p>
                <p className="text-xs text-white/40 mt-1">Providers, schedules, payouts</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Settings className="w-5 h-5 text-amber-400 mb-2" />
                <p className="text-sm font-medium">Configuration</p>
                <p className="text-xs text-white/40 mt-1">Pricing, areas, extras</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Lock className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-sm font-medium">Security</p>
                <p className="text-xs text-white/40 mt-1">Role-based access control</p>
              </div>
            </div>
          </div>

          <p className="text-white/30 text-xs">
            &copy; 2026 Hygiene Maids. Authorized personnel only.
          </p>
        </div>
      </div>

      {/* Right side - Admin Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <span className="text-lg font-semibold">Hygiene Maids</span>
              <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Admin Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Administrator Sign In</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Access the management dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Admin Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@hygienemaids.com"
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
                  placeholder="Enter admin password"
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
              className="w-full h-11 gap-2 font-medium bg-slate-900 hover:bg-slate-800 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sign In to Admin
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Not an administrator?{" "}
              <Link href="/auth/login" className="text-teal-600 hover:underline font-medium">
                Customer &amp; Cleaner Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
