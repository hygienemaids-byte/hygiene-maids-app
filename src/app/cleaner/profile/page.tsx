"use client";
import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Save, Shield, Key, Star, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function CleanerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prov } = await supabase
        .from("providers")
        .select("*")
        .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
        .single();

      if (prov) {
        setProvider(prov);
        setForm({
          firstName: prov.first_name || "",
          lastName: prov.last_name || "",
          email: prov.email || user.email || "",
          phone: prov.phone || "",
          bio: prov.bio || "",
        });
      } else {
        setForm((prev) => ({ ...prev, email: user.email || "" }));
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!provider) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("providers")
        .update({
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          bio: form.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", provider.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch {
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
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch {
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
        <p className="text-slate-500 mt-1">Manage your cleaner profile and account settings.</p>
      </div>

      {/* Provider Status */}
      {provider && (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center text-lg font-bold">
                {form.firstName.charAt(0)}{form.lastName.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{form.firstName} {form.lastName}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline" className={
                    provider.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }>
                    {provider.status as string}
                  </Badge>
                  {provider.rating && (
                    <span className="flex items-center gap-1 text-sm text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {(provider.rating as number).toFixed(1)}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Member since {new Date(provider.created_at as string).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-slate-700">Last Name</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</Label>
              <Input value={form.email} disabled className="mt-1.5 bg-slate-50" />
              <p className="text-xs text-slate-400 mt-1">Contact admin to change email</p>
            </div>
            <div>
              <Label className="text-slate-700 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(469) 555-0123" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-slate-700">Bio / About Me</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell customers about yourself and your cleaning experience..."
              className="mt-1.5"
              rows={4}
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
              <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Min 6 characters" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-slate-700">Confirm Password</Label>
              <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Repeat password" className="mt-1.5" />
            </div>
          </div>
          <Button variant="outline" onClick={handleChangePassword} disabled={changingPassword || !passwordForm.newPassword}>
            <Key className="w-4 h-4 mr-2" />
            {changingPassword ? "Updating..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
