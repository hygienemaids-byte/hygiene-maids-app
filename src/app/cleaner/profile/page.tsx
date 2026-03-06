// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Save, Shield, Key, Star, Camera, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function CleanerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
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

      // Get profile for avatar
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(prof);

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
        });
      } else {
        setForm((prev) => ({ ...prev, email: user.email || "" }));
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, try public bucket
        const { error: uploadError2 } = await supabase.storage
          .from("public")
          .upload(`avatars/${fileName}`, file, { upsert: true });
        if (uploadError2) throw uploadError2;

        const { data: urlData } = supabase.storage.from("public").getPublicUrl(`avatars/${fileName}`);
        const avatarUrl = urlData.publicUrl;

        await supabase.from("profiles").update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq("id", user.id);
        setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      } else {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        const avatarUrl = urlData.publicUrl;

        await supabase.from("profiles").update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq("id", user.id);
        setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      }

      toast.success("Profile photo updated");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload photo. Storage may not be configured.");
    } finally {
      setUploading(false);
    }
  };

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
          updated_at: new Date().toISOString(),
        })
        .eq("id", provider.id);

      if (error) throw error;

      // Also update profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          updated_at: new Date().toISOString(),
        }).eq("id", user.id);
      }

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

  const initials = `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account and personal information.</p>
      </div>

      {/* Profile Photo + Status */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="py-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url as string} alt={form.firstName} />
                <AvatarFallback className="bg-slate-800 text-white text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-colors shadow-md"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">{form.firstName} {form.lastName}</h3>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {provider && (
                  <>
                    <Badge variant="outline" className={
                      provider.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      provider.status === "on_leave" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    }>
                      {(provider.status as string)?.replace("_", " ")}
                    </Badge>
                    {(provider.avg_rating as number) > 0 && (
                      <span className="flex items-center gap-1 text-sm text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {(provider.avg_rating as number).toFixed(1)}
                        <span className="text-slate-400">({provider.total_reviews} reviews)</span>
                      </span>
                    )}
                  </>
                )}
                {provider?.city && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" />
                    {provider.city}, {provider.state}
                  </span>
                )}
              </div>
              {provider?.hire_date && (
                <p className="text-xs text-slate-400 mt-1">
                  Member since {new Date(provider.hire_date as string).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              )}
              {uploading && <p className="text-xs text-teal-600 mt-1">Uploading photo...</p>}
            </div>
          </div>
        </CardContent>
      </Card>

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
              <p className="text-xs text-slate-400 mt-1">Contact admin to update your email</p>
            </div>
            <div>
              <Label className="text-slate-700 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(469) 555-0123" className="mt-1.5" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            Change Password
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
          {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
          <Button variant="outline" onClick={handleChangePassword} disabled={changingPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}>
            <Key className="w-4 h-4 mr-2" />
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
