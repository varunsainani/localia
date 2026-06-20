"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search, GitCompare, MessageCircle, ArrowRight, MapPin, Star, AlertCircle } from "lucide-react";
import {
  listCategories,
  searchProviders,
  type Category,
  type ProviderCard as ProviderCardType,
} from "@/lib/api";
import { HeroSearch } from "@/components/hero-search";
import { ProviderCard } from "@/components/provider-card";
import { CategoryIcon } from "@/components/category-icon";
import { ProviderMap, type MapPoint } from "@/components/map";
import { Button } from "@/components/ui/button";
import { LoadingBlock, EmptyState } from "@/components/states";
import { useAppFormat } from "@/i18n/use-app-format";

export function HomeClient() {
  const t = useTranslations("landing");
  const tc = useTranslations("categories");
  const tcommon = useTranslations("common");
  const fmt = useAppFormat();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<ProviderCardType[]>([]);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [cats, featuredRes, mapRes] = await Promise.all([
        listCategories(),
        searchProviders({ sort: "rating", pageSize: 6 }),
        // A wider pull just to populate the map preview.
        searchProviders({ pageSize: 50 }),
      ]);
      setCategories(cats);
      setFeatured(featuredRes.items);
      setTotal(featuredRes.total);
      setMapPoints(
        mapRes.items.map((p) => ({
          id: p.id,
          slug: p.slug,
          lat: p.lat,
          lng: p.lng,
          businessName: p.businessName,
          headline: p.headline,
          city: p.city,
          featured: p.featured,
        })),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cityCount = new Set(mapPoints.map((p) => p.city).filter(Boolean)).size;

  const steps = [
    { icon: Search, title: t("how.step1Title"), desc: t("how.step1Desc") },
    { icon: GitCompare, title: t("how.step2Title"), desc: t("how.step2Desc") },
    { icon: MessageCircle, title: t("how.step3Title"), desc: t("how.step3Desc") },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <LoadingBlock />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <EmptyState
          icon={AlertCircle}
          title={t("loadError")}
          action={
            <Button variant="outline" onClick={load}>
              {tcommon("retry")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {t("hero.badge")}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {t("hero.subtitle")}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <HeroSearch categories={categories} />
            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground">{t("hero.popular")}</span>
                {categories.slice(0, 4).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4">
            {[
              { value: total, label: t("stats.providers") },
              { value: categories.length, label: t("stats.categories") },
              { value: cityCount, label: t("stats.cities") },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-foreground sm:text-3xl">
                  {fmt.number(s.value)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("categories.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("categories.subtitle")}</p>
          </div>
          <Link
            href="/categories"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            {tc("browseAll")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <CategoryIcon name={c.icon || c.slug} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("categories.count", { count: c.providerCount })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured providers */}
      {featured.length > 0 && (
        <section className="border-y border-border bg-subtle">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                  <Star className="h-5 w-5 text-primary" fill="currentColor" />
                  {t("featured.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("featured.subtitle")}</p>
              </div>
              <Link
                href="/search"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
              >
                {tc("browseAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">{t("how.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("how.subtitle")}</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="relative rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-6 w-6" />
              </div>
              <span className="absolute right-4 top-4 text-3xl font-bold text-muted/60">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Map preview */}
      <section className="border-y border-border bg-subtle">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("mapPreview.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("mapPreview.subtitle")}</p>
            <Link href="/search?view=map" className="mt-6 inline-block">
              <Button size="lg">
                <MapPin className="h-4 w-4" />
                {t("mapPreview.cta")}
              </Button>
            </Link>
          </div>
          <div className="h-80 overflow-hidden rounded-2xl border border-border shadow-sm">
            <ProviderMap points={mapPoints} scrollWheelZoom={false} />
          </div>
        </div>
      </section>

      {/* Provider CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">
            {t("providerCta.title")}
          </h2>
          <p className="relative mx-auto mt-2 max-w-xl text-primary-foreground/85">
            {t("providerCta.subtitle")}
          </p>
          <Link href="/register" className="relative mt-6 inline-block">
            <span className="inline-flex h-11 items-center gap-2 rounded-md bg-card px-6 text-sm font-semibold text-primary shadow-sm transition-transform hover:scale-[1.02]">
              {t("providerCta.cta")}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
