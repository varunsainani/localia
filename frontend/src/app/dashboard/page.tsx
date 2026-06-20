"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eye, Star, MessageSquare, ExternalLink, UserPlus, Send, AlertCircle } from "lucide-react";
import {
  getMyProvider,
  getMyProviderStats,
  submitMyProvider,
  type ProviderDetail,
  type ProviderStats,
  type ProviderStatus,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingBlock, EmptyState } from "@/components/states";
import { useAppFormat } from "@/i18n/use-app-format";

const STATUS_TONE: Record<ProviderStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "neutral",
};

export default function DashboardOverview() {
  const t = useTranslations("dashboard");
  const ts = useTranslations("dashboard.status");
  const tc = useTranslations("common");
  const fmt = useAppFormat();

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const p = await getMyProvider();
      setProvider(p);
      if (p) {
        const s = await getMyProviderStats().catch(() => null);
        setStats(s);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    setSubmitting(true);
    try {
      const p = await submitMyProvider();
      setProvider(p);
      setStats((s) => (s ? { ...s, status: p.status ?? "PENDING" } : s));
      setSubmitted(true);
    } catch {
      // ignore — status unchanged
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingBlock />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("overview.title")} description={t("overview.subtitle")} />
        <EmptyState
          icon={AlertCircle}
          title={t("loadError")}
          action={
            <Button variant="outline" onClick={load}>
              {tc("retry")}
            </Button>
          }
        />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("overview.title")} description={t("overview.subtitle")} />
        <EmptyState
          icon={UserPlus}
          title={t("overview.noProfileTitle")}
          subtitle={t("overview.noProfileSubtitle")}
          action={
            <Link href="/dashboard/profile">
              <Button>{t("overview.createProfile")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const status = (stats?.status ?? provider.status ?? "PENDING") as ProviderStatus;
  const statusHint = {
    PENDING: ts("pendingHint"),
    APPROVED: ts("approvedHint"),
    REJECTED: ts("rejectedHint"),
    SUSPENDED: ts("suspendedHint"),
  }[status];

  const cards = [
    {
      icon: Eye,
      label: t("overview.views"),
      value: fmt.number(stats?.views ?? 0),
    },
    {
      icon: Star,
      label: t("overview.rating"),
      value: (stats?.ratingAvg ?? provider.ratingAvg) > 0 ? fmt.decimal(stats?.ratingAvg ?? provider.ratingAvg, 1) : "—",
    },
    {
      icon: MessageSquare,
      label: t("overview.reviews"),
      value: fmt.number(stats?.reviewCount ?? provider.reviewCount ?? 0),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("overview.title")}
        description={t("overview.subtitle")}
        actions={
          <>
            <Link href="/dashboard/profile">
              <Button variant="outline">{t("overview.editProfile")}</Button>
            </Link>
            {status === "APPROVED" && (
              <Link href={`/p/${provider.slug}`} target="_blank">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4" />
                  {t("overview.viewPublic")}
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Status */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t("overview.statusTitle")}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={STATUS_TONE[status]}>{ts(status)}</Badge>
            </div>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{statusHint}</p>
          </div>
          {(status === "REJECTED" || status === "PENDING") && !submitted && (
            <div className="text-right">
              <Button onClick={submit} disabled={submitting || status === "PENDING"}>
                <Send className="h-4 w-4" />
                {submitting ? t("overview.submitting") : t("overview.submitForReview")}
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">{t("overview.submitHint")}</p>
            </div>
          )}
          {submitted && (
            <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              {t("overview.submitSuccess")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
