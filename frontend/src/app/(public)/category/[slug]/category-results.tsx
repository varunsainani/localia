"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Search, AlertCircle } from "lucide-react";
import { searchProviders, type ProviderCard as ProviderCardType } from "@/lib/api";
import { ProviderCard } from "@/components/provider-card";
import { CategoryIcon } from "@/components/category-icon";
import { LoadingBlock, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";

export function CategoryResults({
  slug,
  name: initialName,
  icon,
}: {
  slug: string;
  name?: string;
  icon?: string;
}) {
  const t = useTranslations("categories");
  const ts = useTranslations("search");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");
  const [items, setItems] = useState<ProviderCardType[] | null>(null);
  const [error, setError] = useState(false);
  const [name, setName] = useState<string>(initialName ?? "");

  const load = useCallback(() => {
    setItems(null);
    setError(false);
    searchProviders({ category: slug, pageSize: 24, sort: "rating" })
      .then((res) => {
        setItems(res.items);
        const facet = res.facets?.categories.find((c) => c.slug === slug);
        if (facet) setName(facet.name);
        else if (res.items[0]) {
          const cat = res.items[0].categories.find((c) => c.slug === slug);
          if (cat) setName(cat.name);
        }
      })
      .catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const title = name || initialName || slug;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {tn("home")}
        </Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-foreground">
          {t("browseAll")}
        </Link>
      </nav>

      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CategoryIcon name={icon || slug} className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {items && (
            <p className="mt-1 text-muted-foreground">
              {t("providerCount", { count: items.length })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        {error ? (
          <EmptyState
            icon={AlertCircle}
            title={ts("loadError")}
            action={
              <Button variant="outline" onClick={load}>
                {tc("retry")}
              </Button>
            }
          />
        ) : items === null ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t("noProviders")}
            action={
              <Link href="/categories">
                <Button variant="outline">{t("browseAll")}</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href={`/search?category=${slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {ts("title")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
