"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  MapPin,
  Phone,
  CheckCircle2,
  Heart,
  Share2,
  Star,
  ArrowLeft,
  Frown,
} from "lucide-react";
import {
  getProvider,
  addFavorite,
  removeFavorite,
  listFavorites,
  type ProviderDetail,
} from "@/lib/api";
import { useAuth } from "@/components/auth-context";
import { CategoryIcon } from "@/components/category-icon";
import { RatingStars } from "@/components/rating-stars";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ProviderMap, type MapPoint } from "@/components/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingBlock, EmptyState } from "@/components/states";
import { ReviewSection } from "./review-section";
import { useAppFormat } from "@/i18n/use-app-format";
import { initials } from "@/lib/utils";
import { locationLine, phoneDigits } from "@/lib/format";

export function ProfileClient({ slug }: { slug: string }) {
  const t = useTranslations("profile");
  const ta = useTranslations("availability");
  const fmt = useAppFormat();
  const router = useRouter();
  const { user } = useAuth();

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [shareLabel, setShareLabel] = useState("");

  useEffect(() => {
    getProvider(slug)
      .then(setProvider)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (user?.role === "CLIENT" && provider) {
      listFavorites()
        .then((items) => setFavorited(items.some((p) => p.id === provider.id)))
        .catch(() => {});
    }
  }, [user, provider]);

  async function toggleFavorite() {
    if (!provider) return;
    if (user?.role !== "CLIENT") {
      router.push("/login");
      return;
    }
    const next = !favorited;
    setFavorited(next);
    try {
      if (next) await addFavorite(provider.id);
      else await removeFavorite(provider.id);
    } catch {
      setFavorited(!next); // revert on failure
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: provider?.businessName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareLabel(t("shareCopied"));
        setTimeout(() => setShareLabel(""), 2000);
      }
    } catch {
      // user dismissed share sheet — no-op
    }
  }

  if (loading) return <LoadingBlock />;
  if (error || !provider) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={Frown}
          title={t("notFound")}
          action={
            <Link href="/search">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                {t("backToSearch")}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const gallery = [provider.coverUrl, ...(provider.photos ?? [])].filter(Boolean) as string[];
  const primaryCategory = provider.categories[0]?.name ?? "";
  const point: MapPoint[] =
    provider.lat || provider.lng
      ? [
          {
            id: provider.id,
            slug: provider.slug,
            lat: provider.lat,
            lng: provider.lng,
            businessName: provider.businessName,
            headline: provider.headline,
            city: provider.city,
            featured: provider.featured,
          },
        ]
      : [];

  const availabilityTone =
    provider.availability === "available"
      ? "success"
      : provider.availability === "busy"
        ? "warning"
        : "neutral";

  return (
    <div className="bg-subtle">
      {/* Cover */}
      <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-64">
        {gallery[activePhoto] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gallery[activePhoto]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-x-0 top-0 p-4">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 rounded-md bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur hover:bg-background"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToSearch")}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header card */}
        <div className="-mt-12 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-card bg-muted shadow-sm">
              {provider.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={provider.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-bold text-primary">
                  {initials(provider.businessName)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{provider.businessName}</h1>
                {provider.featured && (
                  <Badge tone="primary">
                    <Star className="h-3 w-3" fill="currentColor" />
                  </Badge>
                )}
                <Badge tone={availabilityTone}>{ta(provider.availability)}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{provider.headline}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <RatingStars value={provider.ratingAvg} size={15} />
                  <span className="font-medium text-foreground">
                    {provider.ratingAvg > 0 ? fmt.decimal(provider.ratingAvg, 1) : "—"}
                  </span>
                  <span>({t("reviewCount", { count: provider.reviewCount })})</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {locationLine([provider.city, provider.region, provider.country])}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {provider.categories.map((c) => (
                  <Link key={c.slug} href={`/category/${c.slug}`}>
                    <Badge tone="secondary">
                      <CategoryIcon name={c.slug} className="h-3 w-3" />
                      {c.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFavorite}
                aria-label={favorited ? t("favorited") : t("favorite")}
                title={user?.role !== "CLIENT" ? t("favoriteSignIn") : undefined}
              >
                <Heart
                  className={favorited ? "h-[18px] w-[18px] text-danger" : "h-[18px] w-[18px]"}
                  fill={favorited ? "currentColor" : "none"}
                />
              </Button>
              <Button variant="outline" size="icon" onClick={share} aria-label={t("share")}>
                <Share2 className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>

          {shareLabel && <p className="mt-2 text-xs text-success">{shareLabel}</p>}
        </div>

        {/* Body */}
        <div className="mt-6 grid gap-6 pb-16 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {/* Gallery thumbnails */}
            {gallery.length > 1 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold">{t("gallery")}</h2>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {gallery.map((url, i) => (
                    <button
                      key={url + i}
                      type="button"
                      onClick={() => setActivePhoto(i)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                        activePhoto === i ? "border-primary" : "border-transparent hover:border-border"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* About */}
            <section>
              <h2 className="mb-2 text-lg font-semibold">{t("about")}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {provider.about || t("noAbout")}
              </p>
            </section>

            {/* Services */}
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t("services")}</h2>
              {provider.services.length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {provider.services.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noServices")}</p>
              )}
            </section>

            {/* Map */}
            {point.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold">{t("location")}</h2>
                <div className="h-72 overflow-hidden rounded-xl border border-border">
                  <ProviderMap points={point} scrollWheelZoom={false} />
                </div>
                {provider.addressLine && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {locationLine([provider.addressLine, provider.city, provider.region])}
                  </p>
                )}
              </section>
            )}

            {/* Reviews */}
            <ReviewSection
              slug={slug}
              initialReviews={provider.reviews ?? []}
              reviewCount={provider.reviewCount}
              ratingAvg={provider.ratingAvg}
            />
          </div>

          {/* Sticky contact card */}
          <aside>
            <div className="sticky top-20 space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">{t("contact")}</h2>
              <WhatsAppButton
                whatsapp={provider.whatsapp}
                message={t("whatsappMessage", { name: provider.businessName })}
                label={t("whatsappCta")}
                full
              />
              {phoneDigits(provider.phone) && (
                <a
                  href={`tel:${phoneDigits(provider.phone)}`}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Phone className="h-4 w-4" />
                  {t("callCta")}
                </a>
              )}
              <div className="border-t border-border pt-3 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {locationLine([provider.city, provider.country])}
                </p>
                {provider.createdAt && (
                  <p className="mt-1.5">{t("memberSince", { date: fmt.date(provider.createdAt) })}</p>
                )}
                {primaryCategory && <p className="mt-1.5">{primaryCategory}</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
