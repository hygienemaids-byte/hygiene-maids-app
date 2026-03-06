"use client";
import { useState } from "react";
import { Star, MessageSquare, Edit2, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Review = Record<string, unknown>;

async function getCustomerReviews() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { reviews: [], customerId: null };

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!customer) return { reviews: [], customerId: null };

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return { reviews: reviews || [], customerId: customer.id };
}

export default function CustomerReviews() {
  const { data, loading, refetch } = useQuery(() => getCustomerReviews(), []);
  const reviews = data?.reviews || [];

  const [editDialog, setEditDialog] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: Review) => sum + (r.rating as number), 0) / reviews.length).toFixed(1)
    : "—";

  const handleEdit = async () => {
    if (!editDialog) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: editDialog.id,
          rating: editRating,
          comment: editComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Review updated!");
      setEditDialog(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reviews?reviewId=${deleteDialog.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Review deleted");
      setDeleteDialog(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Reviews</h1>
        <p className="text-slate-500 mt-1">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""} · Average rating: {avgRating}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-5 h-5 ${
                  s <= Math.round(Number(avgRating)) ? "text-amber-400 fill-amber-400" : "text-slate-200"
                }`} />
              ))}
            </div>
            <p className="text-2xl font-bold text-slate-900">{avgRating}</p>
            <p className="text-xs text-slate-500">Average Rating</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4 text-center">
            <MessageSquare className="w-6 h-6 text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
            <p className="text-xs text-slate-500">Total Reviews</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4 text-center">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">
              {reviews.filter((r: Review) => (r.rating as number) === 5).length}
            </p>
            <p className="text-xs text-slate-500">5-Star Reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No reviews yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              After your first completed cleaning, you can leave a review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: Review) => (
            <Card key={review.id as string} className="border-slate-200 bg-white">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${
                            s <= (review.rating as number) ? "text-amber-400 fill-amber-400" : "text-slate-200"
                          }`} />
                        ))}
                      </div>
                      <Badge variant="outline" className={
                        review.is_public ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                      }>
                        {review.is_public ? "Public" : "Private"}
                      </Badge>
                      {review.admin_response && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Responded
                        </Badge>
                      )}
                    </div>

                    {review.comment && (
                      <p className="text-sm text-slate-700 mt-2">{review.comment as string}</p>
                    )}

                    {review.admin_response && (
                      <div className="mt-3 pl-4 border-l-2 border-teal-200">
                        <p className="text-xs font-medium text-teal-700 mb-0.5">Hygiene Maids Response:</p>
                        <p className="text-sm text-slate-600">{review.admin_response as string}</p>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(review.created_at as string).toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric",
                      })}
                      {review.booking_id && (
                        <span> · Booking #{review.booking_id as string}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditDialog(review);
                        setEditRating(review.rating as number);
                        setEditComment((review.comment as string) || "");
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog(review)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>Update your rating and comment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star className={`w-8 h-8 ${
                      star <= editRating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                    }`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Comment</label>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="mt-1.5"
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Delete Review
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
