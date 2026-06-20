"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search, Star, ExternalLink, Users } from "lucide-react";
import {
  listAdminProviders,
  patchProvider,
  ApiError,
  type ProviderCard,
  type ProviderStatus,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { LoadingBlock, EmptyState } from "@/components/states";
import { useAppFormat } from "@/i18n/use-app-format";
import { initials } from "@/lib/utils";
import { locationLine } from "@/lib/format";

const STATUS_TONE: Record<ProviderStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "neutral",
};

const STATUSES: ProviderStatus[] = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

export default function AdminProviders() {
  const t = useTranslations("admin.providers");
  const ts = useTranslations("dashboard.status");
  const fmt = useAppFormat();

  const [items, setItems] = useState<ProviderCard[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProviderStatus | "">("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await listAdminProviders({ q: q || undefined, status, page });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
    }
  }, [q, status, page]);

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  // Reset to page 1 at the filter-change source rather than in an effect.
  function onSearch(value: string) {
    setQ(value);
    setPage(1);
  }

  function onStatus(value: ProviderStatus | "") {
    setStatus(value);
    setPage(1);
  }

  async function apply(id: string, patch: { featured?: boolean; status?: ProviderStatus }) {
    setBusy(id);
    setError("");
    try {
      const updated = await patchProvider(id, patch);
      setItems((list) => list?.map((p) => (p.id === id ? { ...p, ...updated } : p)) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("actionError"));
    } finally {
      setBusy(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => onStatus(e.target.value as ProviderStatus | "")}
          className="sm:w-48"
        >
          <option value="">{t("allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ts(s)}
            </option>
          ))}
        </Select>
      </div>

      {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {items === null ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState icon={Users} title={t("empty")} />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-bold text-primary">
                        {initials(p.businessName)}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/p/${p.slug}`} target="_blank" className="font-medium hover:underline">
                        {p.businessName}
                      </Link>
                      {p.status && <Badge tone={STATUS_TONE[p.status]}>{ts(p.status)}</Badge>}
                      {p.featured && <Badge tone="primary">{t("featured")}</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {locationLine([p.city, p.region, p.country])}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-warning" fill="currentColor" />
                    {p.ratingAvg > 0 ? fmt.decimal(p.ratingAvg, 1) : "—"}
                    <span className="text-xs text-muted-foreground">({p.reviewCount})</span>
                  </span>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => apply(p.id, { featured: !p.featured })}
                      disabled={busy === p.id}
                    >
                      {p.featured ? t("unfeature") : t("feature")}
                    </Button>
                    {p.status === "SUSPENDED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => apply(p.id, { status: "APPROVED" })}
                        disabled={busy === p.id}
                      >
                        {t("reinstate")}
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => apply(p.id, { status: "SUSPENDED" })}
                        disabled={busy === p.id}
                      >
                        {t("suspend")}
                      </Button>
                    )}
                    <Link href={`/p/${p.slug}`} target="_blank">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ‹
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
