"use client";
import { useState, useEffect } from "react";
import {
  User, Mail, Phone, MapPin, Save, Shield, Key, LogOut,
  Trash2, AlertTriangle, CheckCircle2, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CustomerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Phone formatting
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length >= 7) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length >= 4) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length > 0) return `(${digits}`;
    return "";
  };

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || "");

      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
        .single();

      if (customer) {
        setCustomerId(customer.id);
        setForm({
          firstName: customer.first_name || "",
          lastName: customer.last_name || "",
          email: customer.email || user.email || "",
          phone: customer.phone || "",
          addressLine1: customer.address_line1 || "",
          addressLine2: customer.address_line2 || "",
          city: customer.city || "",
          state: customer.state || "",
          zipCode: customer.zip_code || "",
          notes: customer.notes || "",
        });
      } else {
        setForm((prev) => ({ ...prev, email: user.email || "" }));
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!customerId) {
      toast.error("No customer profile found");
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("customers")
        .update({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: form.phone,
          address_line1: form.addressLine1.trim(),
          address_line2: form.addressLine2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip_code: form.zipCode.trim(),
          notes: form.notes.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(passwordForm.newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(passwordForm.newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }
    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch {
      toast.error("Failed to log out");
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_deletion", customerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request deletion");
      toast.success("Account deletion requested. You will receive a confirmation email.");
      setDeleteDialog(false);
      setDeleteConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request deletion");
    } finally {
      setDeleting(false);
    }
  };

  // Password strength indicator
  const passwordStrength = (() => {
    const p = passwordForm.newPassword;
    if (!p) return { score: 0, label: "", color: "" };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { score, label: "Fair", color: "bg-amber-500" };
    if (score <= 3) return { score, label: "Good", color: "bg-blue-500" };
    return { score, label: "Strong", color: "bg-emerald-500" };
  })();

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-white rounded-xl border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and security settings.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-slate-600 hover:text-red-600 hover:border-red-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {loggingOut ? "Logging out..." : "Log Out"}
        </Button>
      </div>

      {/* Account Info Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
          {form.firstName ? form.firstName[0].toUpperCase() : userEmail[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="font-semibold text-slate-900">
            {form.firstName && form.lastName ? `${form.firstName} ${form.lastName}` : "Complete your profile"}
          </p>
          <p className="text-sm text-slate-500">{userEmail}</p>
        </div>
      </div>

      {/* Personal Info */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700">First Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="John"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-slate-700">Last Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Smith"
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input value={form.email} disabled className="mt-1.5 bg-slate-50" />
              <p className="text-xs text-slate-400 mt-1">Contact support to change your email</p>
            </div>
            <div>
              <Label className="text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Phone
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                placeholder="(469) 555-0123"
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Default Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-700">Street Address</Label>
            <Input
              value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              placeholder="123 Main St"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-slate-700">Apt / Suite / Unit</Label>
            <Input
              value={form.addressLine2}
              onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
              placeholder="Apt 4B"
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-700">City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-slate-700">State</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-slate-700">Zip Code</Label>
              <Input
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-700">Special Instructions</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Gate code, parking instructions, pet info, etc."
              className="mt-1.5"
              rows={3}
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700">New Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= passwordStrength.score ? passwordStrength.color : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.score <= 1 ? "text-red-500" :
                    passwordStrength.score <= 2 ? "text-amber-500" :
                    passwordStrength.score <= 3 ? "text-blue-500" : "text-emerald-500"
                  }`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-slate-700">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Repeat password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
              )}
              {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
            Password must be at least 8 characters with one uppercase letter and one number.
          </div>
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={changingPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
          >
            <Key className="w-4 h-4 mr-2" />
            {changingPassword ? "Updating..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Delete Account</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shrink-0"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Delete Your Account
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account, booking history, payment records, and all associated data.
              Any active bookings will be cancelled. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-medium">What will be deleted:</p>
              <ul className="text-xs text-red-600 mt-1 space-y-0.5 list-disc list-inside">
                <li>Your customer profile and personal information</li>
                <li>All booking history and records</li>
                <li>Payment history and saved payment methods</li>
                <li>Reviews you&apos;ve written</li>
                <li>Any active or upcoming bookings will be cancelled</li>
              </ul>
            </div>
            <div>
              <Label className="text-slate-700">
                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="mt-1.5 font-mono"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setDeleteDialog(false); setDeleteConfirm(""); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== "DELETE"}
              >
                {deleting ? "Requesting..." : "Permanently Delete Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
