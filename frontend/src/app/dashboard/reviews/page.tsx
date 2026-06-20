"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Star, MessageSquare } from "lucide-react";
import {
  getMyProvider,
  getProviderReviews,
  type Review,
  type ProviderDetail,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { RatingStars } from "@/components/rating-stars";
import { Button } from "@/components/ui/button";
import { LoadingBlock, EmptyState } from "@/components/states";
import { useAppFormat } from "@/i18n/use-app-format";
import { initials } from "@/lib/utils";

export default function DashboardReviews() {
  const t = useTranslations("dashboard.reviews");
  const tp = useTranslations("profile");
  const tr = useTranslations("review");
  const fmt = useAppFormat();

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyProvider();
        setProvider(p);
        if (p) {
          const res = await getProviderReviews(p.slug, 1);
          setReviews(res.items);
          setTotal(res.total);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadMore() {
    if (!provider) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await getProviderReviews(provider.slug, next);
      setReviews((r) => [...r, ...res.items]);
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          provider && total > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm">
              <RatingStars value={provider.ratingAvg} size={15} />
              <span className="font-semibold">{fmt.decimal(provider.ratingAvg, 1)}</span>
              <span className="text-muted-foreground">
                ({tp("reviewCount", { count: total })})
              </span>
            </span>
          ) : undefined
        }
      />

      {reviews.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t("empty")} />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
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
          ))}

          {reviews.length < total && (
            <div className="text-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "…" : tr("loadMore")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
