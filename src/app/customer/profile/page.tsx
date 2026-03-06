"use client";
import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Save, Shield, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function CustomerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
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

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("customers")
        .update({
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          address_line1: form.addressLine1,
          address_line2: form.addressLine2,
          city: form.city,
          state: form.state,
          zip_code: form.zipCode,
          notes: form.notes,
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
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your personal information and preferences.</p>
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
              <Label className="text-slate-700">First Name</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-slate-700">Last Name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
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
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label className="text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Phone
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
              placeholder="Gate code, parking instructions, etc."
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

      {/* Password */}
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
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Min 6 characters"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-slate-700">Confirm Password</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Repeat password"
                className="mt-1.5"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={changingPassword || !passwordForm.newPassword}
          >
            <Key className="w-4 h-4 mr-2" />
            {changingPassword ? "Updating..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
