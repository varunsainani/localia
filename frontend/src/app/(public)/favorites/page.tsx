"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Heart, Search } from "lucide-react";
import { listFavorites, type ProviderCard as ProviderCardType } from "@/lib/api";
import { useAuth } from "@/components/auth-context";
import { ProviderCard } from "@/components/provider-card";
import { PageHeader } from "@/components/page-header";
import { LoadingBlock, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<ProviderCardType[] | null>(null);
  const [error, setError] = useState(false);

  const isClient = user?.role === "CLIENT";

  const load = useCallback(() => {
    setError(false);
    setItems(null);
    listFavorites()
      .then(setItems)
      .catch(() => setError(true));
  }, []);

  // Anonymous visitors get sent to sign in once auth resolves.
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (isClient) load();
  }, [isClient, load]);

  if (authLoading || !user) return <LoadingBlock />;

  // Only CLIENT accounts have favorites.
  if (user.role !== "CLIENT") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={Heart}
          title={t("clientsOnly")}
          subtitle={t("clientsOnlySubtitle")}
          action={
            <Link href="/search">
              <Button variant="outline">{t("browse")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="mt-6">
        {error ? (
          <EmptyState
            icon={Heart}
            title={t("loadError")}
            action={
              <Button variant="outline" onClick={load}>
                {t("retry")}
              </Button>
            }
          />
        ) : items === null ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={t("empty.title")}
            subtitle={t("empty.subtitle")}
            action={
              <Link href="/search">
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                  {t("browse")}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
