// @ts-nocheck
"use client";
import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";

async function fetchReviews() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: provider } = await supabase
    .from("providers")
    .select("id, avg_rating, total_reviews")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!provider) return null;

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, customers(first_name, last_name), bookings(booking_number, scheduled_date)")
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false });

  // Calculate rating distribution
  const dist = [0, 0, 0, 0, 0];
  (reviews || []).forEach((r: Record<string, unknown>) => {
    const rating = (r.rating as number) - 1;
    if (rating >= 0 && rating < 5) dist[rating]++;
  });

  return {
    reviews: reviews || [],
    avgRating: provider.avg_rating || 0,
    totalReviews: provider.total_reviews || (reviews || []).length,
    distribution: dist.reverse(), // [5-star, 4-star, 3-star, 2-star, 1-star]
  };
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export default function CleanerReviews() {
  const { data, loading } = useQuery(() => fetchReviews(), []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-40 bg-white rounded-xl border animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No reviews yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { reviews, avgRating, totalReviews, distribution } = data;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Reviews</h1>
        <p className="text-slate-500 mt-1">See what customers are saying about your service.</p>
      </div>

      {/* Rating Summary */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">{Number(avgRating).toFixed(1)}</p>
              <StarRating rating={Math.round(Number(avgRating))} size="lg" />
              <p className="text-sm text-slate-500 mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 w-full space-y-1.5">
              {[5, 4, 3, 2, 1].map((star, idx) => {
                const count = distribution[idx] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-3">{star}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No reviews yet. Complete more jobs to receive customer feedback.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: Record<string, unknown>) => {
            const customer = review.customers as Record<string, unknown> | null;
            const booking = review.bookings as Record<string, unknown> | null;
            return (
              <Card key={review.id as string} className="border-slate-200 bg-white">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                        {customer ? `${(customer.first_name as string).charAt(0)}${(customer.last_name as string).charAt(0)}` : "C"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {customer ? `${customer.first_name} ${(customer.last_name as string).charAt(0)}.` : "Customer"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={review.rating as number} />
                          <span className="text-xs text-slate-400">
                            {new Date(review.created_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {booking && (
                      <span className="text-xs text-slate-400">Job #{booking.booking_number}</span>
                    )}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">{review.comment as string}</p>
                  )}
                  {review.admin_response && (
                    <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs font-medium text-slate-500">Admin Response</p>
                      <p className="text-sm text-slate-600 mt-0.5">{review.admin_response as string}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
