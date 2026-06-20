"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, MapPin, ChevronDown } from "lucide-react";
import type { Category } from "@/lib/api";

// Hero search: pick a category + city, build a /search query, and navigate.
export function HeroSearch({ categories }: { categories: Category[] }) {
  const t = useTranslations("landing.hero");
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (city.trim()) params.set("city", city.trim());
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg sm:flex-row sm:items-stretch"
    >
      <div className="relative flex-1">
        <label htmlFor="hero-cat" className="sr-only">
          {t("categoryLabel")}
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select
          id="hero-cat"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-12 w-full appearance-none rounded-lg border border-input bg-background pl-9 pr-9 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <option value="">{t("categoryPlaceholder")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex-1">
        <label htmlFor="hero-city" className="sr-only">
          {t("cityLabel")}
        </label>
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="hero-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t("cityPlaceholder")}
          className="h-12 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>

      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
      >
        <Search className="h-4 w-4" />
        {t("searchCta")}
      </button>
    </form>
  );
}
