"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import {
  createReview,
  getProviderReviews,
  ApiError,
  type Review,
} from "@/lib/api";
import { useAuth } from "@/components/auth-context";
import { RatingStars, RatingInput } from "@/components/rating-stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useAppFormat } from "@/i18n/use-app-format";
import { initials } from "@/lib/utils";

export function ReviewSection({
  slug,
  initialReviews,
  reviewCount,
  ratingAvg,
}: {
  slug: string;
  initialReviews: Review[];
  reviewCount: number;
  ratingAvg: number;
}) {
  const t = useTranslations("review");
  const tp = useTranslations("profile");
  const fmt = useAppFormat();
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [total, setTotal] = useState(reviewCount);
  const [avg, setAvg] = useState(ratingAvg);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isClient = user?.role === "CLIENT";
  const isProvider = user?.role === "PROVIDER";

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await getProviderReviews(slug, next);
      setReviews((r) => [...r, ...res.items]);
      setPage(next);
    } catch {
      // ignore — keep existing reviews
    } finally {
      setLoadingMore(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError(t("ratingRequired"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const review = await createReview(slug, { rating, comment });
      setReviews((r) => [review, ...r]);
      const newTotal = total + 1;
      setAvg((avg * total + rating) / newTotal);
      setTotal(newTotal);
      setSuccess(true);
      setRating(0);
      setComment("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errorFallback"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="scroll-mt-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        {total > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <RatingStars value={avg} />
            <span className="font-semibold">{fmt.decimal(avg, 1)}</span>
            <span className="text-muted-foreground">
              ({tp("reviewCount", { count: total })})
            </span>
          </div>
        )}
      </div>

      {/* Write a review */}
      <div className="mt-5 rounded-xl border border-border bg-card p-5">
        {success ? (
          <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{t("success")}</p>
        ) : isClient ? (
          <form onSubmit={submit} className="space-y-3">
            <h3 className="font-medium">{t("writeTitle")}</h3>
            <div>
              <span className="mb-1.5 block text-sm text-muted-foreground">{t("ratingLabel")}</span>
              <RatingInput value={rating} onChange={setRating} />
            </div>
            <div>
              <span className="mb-1.5 block text-sm text-muted-foreground">{t("commentLabel")}</span>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("commentPlaceholder")}
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? t("submitting") : t("submit")}
            </Button>
          </form>
        ) : isProvider ? (
          <p className="text-sm text-muted-foreground">{t("providerCannotReview")}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("signInPrompt")}</p>
        )}
      </div>

      {/* Reviews list */}
      <div className="mt-5 space-y-4">
        {reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-subtle px-4 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initials(r.clientName)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{r.clientName}</p>
                    <p className="text-xs text-muted-foreground">{fmt.date(r.createdAt)}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium">
                  <Star className="h-4 w-4 text-warning" fill="currentColor" />
                  {r.rating}
                </span>
              </div>
              {r.comment && <p className="mt-3 text-sm text-foreground/90">{r.comment}</p>}
            </div>
          ))
        )}

        {reviews.length < total && (
          <div className="text-center">
            <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "…" : t("loadMore")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
