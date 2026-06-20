"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Users, Clock, CheckCircle2, XCircle, UserRound, Star } from "lucide-react";
import { getAdminStats, type AdminStats } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingBlock, EmptyState } from "@/components/states";
import { useAppFormat } from "@/i18n/use-app-format";
import { initials } from "@/lib/utils";
import { locationLine } from "@/lib/format";
import type { ProviderCard } from "@/lib/api";

function MiniProvider({ p }: { p: ProviderCard }) {
  const fmt = useAppFormat();
  return (
    <Link
      href={`/p/${p.slug}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
    >
      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
        {p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-bold text-primary">
            {initials(p.businessName)}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{p.businessName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {locationLine([p.city, p.region])}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm">
        <Star className="h-3.5 w-3.5 text-warning" fill="currentColor" />
        {p.ratingAvg > 0 ? fmt.decimal(p.ratingAvg, 1) : "—"}
      </span>
    </Link>
  );
}

export default function AdminOverview() {
  const t = useTranslations("admin.stats");
  const fmt = useAppFormat();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error || !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <EmptyState icon={Users} title={t("empty")} />
      </div>
    );
  }

  const cards = [
    { icon: Users, label: t("totalProviders"), value: stats.totalProviders, tone: "text-primary bg-primary/10" },
    { icon: Clock, label: t("pending"), value: stats.pending, tone: "text-warning bg-warning/10" },
    { icon: CheckCircle2, label: t("approved"), value: stats.approved, tone: "text-success bg-success/10" },
    { icon: XCircle, label: t("rejected"), value: stats.rejected, tone: "text-danger bg-danger/10" },
    { icon: UserRound, label: t("clients"), value: stats.clients, tone: "text-secondary bg-secondary/10" },
  ];

  const maxCat = Math.max(1, ...stats.byCategory.map((c) => c.count));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{fmt.number(c.value)}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* By category */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t("byCategory")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              stats.byCategory.map((c) => (
                <div key={c.slug}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(c.count / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent */}
        <Card>
          <CardHeader>
            <CardTitle>{t("recent")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              stats.recent.slice(0, 6).map((p) => <MiniProvider key={p.id} p={p} />)
            )}
          </CardContent>
        </Card>

        {/* Top rated */}
        <Card>
          <CardHeader>
            <CardTitle>{t("topRated")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats.topRated.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              stats.topRated.slice(0, 6).map((p) => <MiniProvider key={p.id} p={p} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
