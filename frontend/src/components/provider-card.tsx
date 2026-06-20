"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin, Star } from "lucide-react";
import type { ProviderCard as ProviderCardType } from "@/lib/api";
import { CategoryIcon } from "./category-icon";
import { Badge } from "./ui/badge";
import { useAppFormat } from "@/i18n/use-app-format";
import { initials } from "@/lib/utils";
import { locationLine } from "@/lib/format";
import { cn } from "@/lib/utils";

function AvailabilityDot({ availability }: { availability: ProviderCardType["availability"] }) {
  const t = useTranslations("availability");
  const tone =
    availability === "AVAILABLE"
      ? "bg-success"
      : availability === "BUSY"
        ? "bg-warning"
        : "bg-muted-foreground/50";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", tone)} />
      {t(availability)}
    </span>
  );
}

export function ProviderCard({ provider }: { provider: ProviderCardType }) {
  const t = useTranslations("search");
  const fmt = useAppFormat();

  return (
    <Link
      href={`/p/${provider.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-32 w-full overflow-hidden bg-muted">
        {provider.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={provider.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/15 to-secondary/15" />
        )}
        {provider.featured && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
            <Star className="h-3 w-3" fill="currentColor" />
            ★
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <div className="-mt-9 h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-card bg-muted">
            {provider.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={provider.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-bold text-primary">
                {initials(provider.businessName)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="truncate font-semibold tracking-tight">{provider.businessName}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{provider.headline}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {provider.categories.slice(0, 2).map((c) => (
            <Badge key={c.slug} tone="primary">
              <CategoryIcon name={c.slug} className="h-3 w-3" />
              {c.name}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm">
          <span className="inline-flex items-center gap-1 truncate text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{locationLine([provider.city, provider.region])}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground">
            <Star className="h-3.5 w-3.5 text-warning" fill="currentColor" />
            {provider.ratingAvg > 0 ? fmt.decimal(provider.ratingAvg, 1) : "—"}
            <span className="text-xs font-normal text-muted-foreground">({provider.reviewCount})</span>
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <AvailabilityDot availability={provider.availability} />
          {typeof provider.distanceKm === "number" && (
            <span className="text-xs text-muted-foreground">
              {t("distanceAway", { km: fmt.decimal(provider.distanceKm, 1) })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
