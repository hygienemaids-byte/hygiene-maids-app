// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Star, MapPin, CheckCircle2, Shield, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("first_name, last_name, city, state")
    .eq("id", id)
    .single();

  if (!provider) return { title: "Cleaner Profile | Hygiene Maids" };
  return {
    title: `${provider.first_name} ${provider.last_name?.charAt(0)}. | Hygiene Maids Cleaner`,
    description: `View ${provider.first_name}'s cleaner profile at Hygiene Maids.`,
  };
}

export default async function PublicCleanerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch provider basic info
  const { data: provider } = await supabase
    .from("providers")
    .select("id, profile_id, first_name, last_name, city, state, avg_rating, total_reviews, total_jobs_completed, hire_date, status")
    .eq("id", id)
    .single();

  if (!provider || provider.status === "terminated") {
    notFound();
  }

  // Fetch avatar from profiles table
  let avatarUrl: string | null = null;
  if (provider.profile_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", provider.profile_id)
      .single();
    avatarUrl = profile?.avatar_url || null;
  }

  const rating = Number(provider.avg_rating) || 0;
  const totalReviews = provider.total_reviews || 0;
  const totalJobs = provider.total_jobs_completed || 0;
  const memberSince = provider.hire_date
    ? new Date(provider.hire_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          {/* Avatar */}
          <div className="w-28 h-28 mx-auto rounded-full border-4 border-white/30 overflow-hidden bg-teal-800 flex items-center justify-center shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt={provider.first_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white/80">
                {provider.first_name?.charAt(0)}{provider.last_name?.charAt(0)}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold mt-4">
            {provider.first_name} {provider.last_name?.charAt(0)}.
          </h1>

          {/* Location */}
          {(provider.city || provider.state) && (
            <p className="flex items-center justify-center gap-1.5 text-teal-100 mt-2">
              <MapPin className="w-4 h-4" />
              {[provider.city, provider.state].filter(Boolean).join(", ")}
            </p>
          )}

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i <= Math.round(rating) ? "text-amber-300 fill-amber-300" : "text-teal-400"}`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{rating.toFixed(1)}</span>
              <span className="text-teal-200 text-sm">({totalReviews} review{totalReviews !== 1 ? "s" : ""})</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-10 h-10 mx-auto rounded-full bg-teal-50 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">{totalJobs}</p>
              <p className="text-xs text-slate-500">Jobs Completed</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xl font-bold text-slate-900">{rating > 0 ? rating.toFixed(1) : "—"}</p>
              <p className="text-xs text-slate-500">Avg Rating</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xl font-bold text-slate-900">Verified</p>
              <p className="text-xs text-slate-500">Background Check</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {memberSince && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Hygiene Maids Team Member</p>
                <p className="text-xs text-slate-500">Since {memberSince}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-100 rounded-xl p-5 text-center">
          <p className="text-sm text-slate-500">
            For privacy, contact details are not displayed. To reach your cleaner, please contact Hygiene Maids support.
          </p>
        </div>
      </div>
    </div>
  );
}
