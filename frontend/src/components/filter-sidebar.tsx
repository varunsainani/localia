"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { Availability, Facets, SortOption } from "@/lib/api";
import { Select } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export interface FilterState {
  category: string;
  city: string;
  region: string;
  minRating: number;
  availability: Availability | "";
  radiusKm: number;
  sort: SortOption;
}

export function FilterSidebar({
  state,
  onChange,
  onReset,
  facets,
  categories,
  hasLocation,
}: {
  state: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  facets?: Facets;
  categories: { slug: string; name: string }[];
  hasLocation: boolean;
}) {
  const t = useTranslations("filters");
  const ta = useTranslations("availability");

  const cityOptions = facets?.cities ?? [];
  const ratings = [4.5, 4, 3.5, 3];
  const radii = [5, 10, 25, 50, 100];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t("clear")}
        </button>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("category")}</label>
        <Select value={state.category} onChange={(e) => onChange({ category: e.target.value })}>
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("city")}</label>
        <Select value={state.city} onChange={(e) => onChange({ city: e.target.value })}>
          <option value="">{t("allCities")}</option>
          {cityOptions.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city} ({c.count})
            </option>
          ))}
        </Select>
      </div>

      {/* Minimum rating */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">{t("minRating")}</label>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onChange({ minRating: 0 })}
            className={cn(
              "flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
              state.minRating === 0 ? "bg-accent text-accent-foreground" : "hover:bg-muted",
            )}
          >
            {t("anyRating")}
          </button>
          {ratings.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ minRating: r })}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                state.minRating === r ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              <Star className="h-3.5 w-3.5 text-warning" fill="currentColor" />
              {t("ratingStars", { count: r })}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("availability")}</label>
        <Select
          value={state.availability}
          onChange={(e) => onChange({ availability: e.target.value as Availability | "" })}
        >
          <option value="">{t("anyAvailability")}</option>
          <option value="AVAILABLE">{ta("AVAILABLE")}</option>
          <option value="BUSY">{ta("BUSY")}</option>
          <option value="BY_APPOINTMENT">{ta("BY_APPOINTMENT")}</option>
        </Select>
      </div>

      {/* Distance */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("distance")}</label>
        <Select
          value={state.radiusKm || ""}
          onChange={(e) => onChange({ radiusKm: Number(e.target.value) || 0 })}
          disabled={!hasLocation}
        >
          <option value="">{t("anyDistance")}</option>
          {radii.map((km) => (
            <option key={km} value={km}>
              {t("withinKm", { km })}
            </option>
          ))}
        </Select>
        {!hasLocation && <p className="text-xs text-muted-foreground">{t("needsLocation")}</p>}
      </div>

      <Button variant="outline" className="w-full" onClick={onReset}>
        {t("clear")}
      </Button>
    </div>
  );
}
