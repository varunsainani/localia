"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, Map as MapIcon, List, Navigation, X } from "lucide-react";
import {
  searchProviders,
  listCategories,
  type ProviderSearchResult,
  type Category,
  type SortOption,
} from "@/lib/api";
import { ProviderCard } from "@/components/provider-card";
import { ProviderMap, type MapPoint } from "@/components/map";
import { FilterSidebar, type FilterState } from "@/components/filter-sidebar";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { LoadingBlock, EmptyState } from "@/components/states";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const emptyFilters: FilterState = {
  category: "",
  city: "",
  region: "",
  minRating: 0,
  availability: "",
  radiusKm: 0,
  sort: "relevance",
};

export function SearchClient() {
  const t = useTranslations("search");
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [filters, setFilters] = useState<FilterState>({
    ...emptyFilters,
    category: params.get("category") ?? "",
    city: params.get("city") ?? "",
    sort: (params.get("sort") as SortOption) ?? "relevance",
  });
  const [page, setPage] = useState(1);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<ProviderSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">(
    params.get("view") === "map" ? "map" : "list",
  );

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  // Keep the URL in sync (shareable searches), without scroll jumps.
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (filters.category) p.set("category", filters.category);
    if (filters.city) p.set("city", filters.city);
    if (filters.sort !== "relevance") p.set("sort", filters.sort);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `/search?${qs}` : "/search");
  }, [q, filters.category, filters.city, filters.sort]);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await searchProviders({
        q: q || undefined,
        category: filters.category || undefined,
        city: filters.city || undefined,
        region: filters.region || undefined,
        minRating: filters.minRating || undefined,
        availability: filters.availability || undefined,
        radiusKm: filters.radiusKm || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        sort: filters.sort,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(res);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, filters, page, coords]);

  // Debounce the search so typing in the query box doesn't hammer the API.
  useEffect(() => {
    const id = setTimeout(runSearch, 250);
    return () => clearTimeout(id);
  }, [runSearch]);

  // Any new query/filter sends us back to page 1 — done at the mutation points
  // (not in an effect) so we never trigger a cascading re-render.
  function onQuery(value: string) {
    setQ(value);
    setPage(1);
  }

  function patchFilters(patch: Partial<FilterState>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    setQ("");
    setPage(1);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFilters((f) => ({ ...f, sort: "distance" }));
        setPage(1);
        setLocating(false);
      },
      () => {
        setLocationError(true);
        setLocating(false);
      },
    );
  }

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const mapPoints: MapPoint[] = useMemo(
    () =>
      items.map((p) => ({
        id: p.id,
        slug: p.slug,
        lat: p.lat,
        lng: p.lng,
        businessName: p.businessName,
        headline: p.headline,
        city: p.city,
        featured: p.featured,
      })),
    [items],
  );

  const sortOptions: SortOption[] = ["relevance", "rating", "distance", "newest"];

  const filterPanel = (
    <FilterSidebar
      state={filters}
      onChange={patchFilters}
      onReset={resetFilters}
      facets={data?.facets}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      hasLocation={!!coords}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="sr-only">{t("title")}</h1>
      {/* Search + controls */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("showFilters")}
          </Button>

          <Button
            variant={coords ? "primary" : "outline"}
            size="sm"
            onClick={useMyLocation}
            disabled={locating}
          >
            <Navigation className="h-4 w-4" />
            {locating ? t("locating") : t("useLocation")}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <label className="hidden text-sm text-muted-foreground sm:inline">{t("sortLabel")}</label>
            <Select
              value={filters.sort}
              onChange={(e) => patchFilters({ sort: e.target.value as SortOption })}
              className="h-9 w-auto"
            >
              {sortOptions.map((s) => (
                <option key={s} value={s} disabled={s === "distance" && !coords}>
                  {t(`sort.${s}`)}
                </option>
              ))}
            </Select>

            {/* Mobile list/map toggle */}
            <div className="flex rounded-md border border-border p-0.5 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                aria-label={t("showList")}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded px-2 text-xs font-medium",
                  mobileView === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileView("map")}
                aria-label={t("showMap")}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded px-2 text-xs font-medium",
                  mobileView === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <MapIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {locationError && <p className="text-sm text-danger">{t("locationDenied")}</p>}
        <p className="text-sm text-muted-foreground">{t("resultsCount", { count: total })}</p>
      </div>

      {/* Body: sidebar + results + map */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-5">{filterPanel}</div>
        </aside>

        <div className="grid gap-6 xl:grid-cols-[1fr_minmax(360px,42%)]">
          {/* Results list */}
          <div className={cn(mobileView === "map" && "hidden xl:block")}>
            {loading ? (
              <LoadingBlock label={t("title")} />
            ) : error ? (
              <EmptyState
                icon={Search}
                title={t("loadError")}
                action={
                  <Button variant="outline" onClick={runSearch}>
                    {t("loadError")}
                  </Button>
                }
              />
            ) : items.length === 0 ? (
              <EmptyState
                icon={Search}
                title={t("empty.title")}
                subtitle={t("empty.subtitle")}
                action={
                  <Button variant="outline" onClick={resetFilters}>
                    {t("empty.reset")}
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((p) => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {t("pagination.prev")}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t("pagination.page", { page, total: totalPages })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {t("pagination.next")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Map */}
          <div className={cn("min-h-0", mobileView === "list" && "hidden xl:block")}>
            <div className="sticky top-20 h-[calc(100vh-7rem)] min-h-80 overflow-hidden rounded-xl border border-border">
              <ProviderMap points={mapPoints} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{t("showFilters")}</h2>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                aria-label={t("hideFilters")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
            <Button className="mt-6 w-full" onClick={() => setShowFilters(false)}>
              {t("resultsCount", { count: total })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
