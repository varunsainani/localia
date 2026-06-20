"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, X, ClipboardCheck, ExternalLink, MapPin } from "lucide-react";
import {
  getAdminQueue,
  approveProvider,
  rejectProvider,
  ApiError,
  type ProviderCard,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { CategoryIcon } from "@/components/category-icon";
import { LoadingBlock, EmptyState } from "@/components/states";
import { initials } from "@/lib/utils";
import { locationLine } from "@/lib/format";

export default function ReviewQueue() {
  const t = useTranslations("admin.queue");
  const tc = useTranslations("common");
  const tStatus = useTranslations("dashboard.status");
  const [items, setItems] = useState<ProviderCard[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    getAdminQueue()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function approve(id: string) {
    setError("");
    setBusy(id);
    const prev = items;
    setItems((list) => list?.filter((p) => p.id !== id) ?? null); // optimistic
    try {
      await approveProvider(id);
      flash(t("approved"));
    } catch (err) {
      setItems(prev ?? null); // revert
      setError(err instanceof ApiError ? err.message : t("actionError"));
    } finally {
      setBusy(null);
    }
  }

  async function confirmReject(id: string) {
    if (!reason.trim()) {
      setError(t("reasonRequired"));
      return;
    }
    setError("");
    setBusy(id);
    const prev = items;
    setItems((list) => list?.filter((p) => p.id !== id) ?? null); // optimistic
    try {
      await rejectProvider(id, reason.trim());
      flash(t("rejected"));
      setRejecting(null);
      setReason("");
    } catch (err) {
      setItems(prev ?? null);
      setError(err instanceof ApiError ? err.message : t("actionError"));
    } finally {
      setBusy(null);
    }
  }

  if (items === null) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {toast && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{toast}</p>
      )}
      {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {items.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={t("empty")} />
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{p.businessName}</h3>
                      <Badge tone="warning">{tStatus("PENDING")}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{p.headline}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {locationLine([p.city, p.region, p.country])}
                      </span>
                      {p.categories.map((c) => (
                        <span key={c.slug} className="inline-flex items-center gap-1">
                          <CategoryIcon name={c.slug} className="h-3.5 w-3.5" />
                          {c.name}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/p/${p.slug}`}
                      target="_blank"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {p.slug}
                    </Link>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => approve(p.id)}
                      disabled={busy === p.id}
                    >
                      <Check className="h-4 w-4" />
                      {busy === p.id ? t("approving") : t("approve")}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setRejecting(rejecting === p.id ? null : p.id);
                        setReason("");
                        setError("");
                      }}
                      disabled={busy === p.id}
                    >
                      <X className="h-4 w-4" />
                      {t("reject")}
                    </Button>
                  </div>
                </div>

                {rejecting === p.id && (
                  <div className="mt-4 rounded-lg border border-border bg-subtle p-4">
                    <p className="mb-2 text-sm font-medium">{t("rejectTitle")}</p>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t("rejectReasonPlaceholder")}
                      rows={3}
                    />
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => confirmReject(p.id)}
                        disabled={busy === p.id}
                      >
                        {busy === p.id ? t("rejecting") : t("rejectConfirm")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRejecting(null);
                          setReason("");
                        }}
                      >
                        {tc("cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
