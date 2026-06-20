"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import {
  getMyProvider,
  saveMyProvider,
  listCategories,
  ApiError,
  type Category,
  type ProviderInput,
  type Availability,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/category-icon";
import { LocationPicker } from "@/components/map/location-picker";
import { ImageUploadField, GalleryUploader } from "@/components/photo-uploader";
import { LoadingBlock } from "@/components/states";
import { cn } from "@/lib/utils";

const emptyForm: ProviderInput = {
  businessName: "",
  headline: "",
  about: "",
  services: [],
  categorySlugs: [],
  phone: "",
  whatsapp: "",
  addressLine: "",
  city: "",
  region: "",
  country: "",
  lat: 0,
  lng: 0,
  availability: "available",
  avatarUrl: null,
  coverUrl: null,
  photos: [],
};

export default function ProfileEditor() {
  const t = useTranslations("dashboard.editor");
  const ta = useTranslations("availability");

  const [form, setForm] = useState<ProviderInput>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceDraft, setServiceDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const [cats, provider] = await Promise.all([
        listCategories().catch(() => [] as Category[]),
        getMyProvider().catch(() => null),
      ]);
      setCategories(cats);
      if (provider) {
        setForm({
          businessName: provider.businessName ?? "",
          headline: provider.headline ?? "",
          about: provider.about ?? "",
          services: provider.services ?? [],
          categorySlugs: provider.categories?.map((c) => c.slug) ?? [],
          phone: provider.phone ?? "",
          whatsapp: provider.whatsapp ?? "",
          addressLine: provider.addressLine ?? "",
          city: provider.city ?? "",
          region: provider.region ?? "",
          country: provider.country ?? "",
          lat: provider.lat ?? 0,
          lng: provider.lng ?? 0,
          availability: provider.availability ?? "available",
          avatarUrl: provider.avatarUrl ?? null,
          coverUrl: provider.coverUrl ?? null,
          photos: provider.photos ?? [],
        });
      }
      setLoading(false);
    })();
  }, []);

  function patch<K extends keyof ProviderInput>(key: K, value: ProviderInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  function toggleCategory(slug: string) {
    setForm((f) => {
      const has = f.categorySlugs.includes(slug);
      if (has) return { ...f, categorySlugs: f.categorySlugs.filter((s) => s !== slug) };
      if (f.categorySlugs.length >= 2) return f; // up to 2
      return { ...f, categorySlugs: [...f.categorySlugs, slug] };
    });
    setSuccess(false);
  }

  function addService() {
    const value = serviceDraft.trim();
    if (!value) return;
    if (!form.services.includes(value)) patch("services", [...form.services, value]);
    setServiceDraft("");
  }

  function removeService(s: string) {
    patch("services", form.services.filter((x) => x !== s));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.businessName.trim() || !form.headline.trim() || form.categorySlugs.length === 0) {
      setError(t("requiredFields"));
      return;
    }
    setSaving(true);
    try {
      const saved = await saveMyProvider(form);
      setForm((f) => ({ ...f, photos: saved.photos ?? f.photos }));
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errorFallback"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock />;

  const availabilities: Availability[] = ["available", "busy", "unavailable"];

  return (
    <form onSubmit={save} className="space-y-6 pb-12">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button type="submit" disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        }
      />

      {success && (
        <p className="rounded-md bg-success/10 px-3 py-2.5 text-sm text-success">{t("saveSuccess")}</p>
      )}
      {error && <p className="rounded-md bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</p>}

      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle>{t("basics")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("businessName")}</span>
            <Input
              value={form.businessName}
              onChange={(e) => patch("businessName", e.target.value)}
              placeholder={t("businessNamePlaceholder")}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("headline")}</span>
            <Input
              value={form.headline}
              onChange={(e) => patch("headline", e.target.value)}
              placeholder={t("headlinePlaceholder")}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("about")}</span>
            <Textarea
              value={form.about}
              onChange={(e) => patch("about", e.target.value)}
              placeholder={t("aboutPlaceholder")}
              rows={5}
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-sm font-medium">{t("availability")}</span>
            <Select
              value={form.availability}
              onChange={(e) => patch("availability", e.target.value as Availability)}
              className="sm:max-w-xs"
            >
              {availabilities.map((a) => (
                <option key={a} value={a}>
                  {ta(a)}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>{t("categories")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("categoriesHint")}</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = form.categorySlugs.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggleCategory(c.slug)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <CategoryIcon name={c.icon || c.slug} className="h-3.5 w-3.5" />
                  {c.name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>{t("services")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("servicesHint")}</p>
          <div className="flex gap-2">
            <Input
              value={serviceDraft}
              onChange={(e) => setServiceDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addService();
                }
              }}
              placeholder={t("servicePlaceholder")}
            />
            <Button type="button" variant="outline" onClick={addService}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {form.services.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.services.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeService(s)}
                    className="text-accent-foreground/60 hover:text-accent-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contact")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("phone")}</span>
            <Input
              value={form.phone}
              onChange={(e) => patch("phone", e.target.value)}
              placeholder={t("phonePlaceholder")}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("whatsapp")}</span>
            <Input
              value={form.whatsapp}
              onChange={(e) => patch("whatsapp", e.target.value)}
              placeholder={t("whatsappPlaceholder")}
            />
            <span className="text-xs text-muted-foreground">{t("whatsappHint")}</span>
          </label>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("media")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-6">
            <ImageUploadField
              value={form.avatarUrl ?? null}
              onChange={(url) => patch("avatarUrl", url)}
              label={t("avatar")}
              aspect="square"
            />
            <div className="flex-1 min-w-[220px]">
              <ImageUploadField
                value={form.coverUrl ?? null}
                onChange={(url) => patch("coverUrl", url)}
                label={t("cover")}
                aspect="wide"
              />
            </div>
          </div>
          <GalleryUploader
            photos={form.photos ?? []}
            onChange={(photos) => patch("photos", photos)}
          />
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>{t("locationSection")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium">{t("address")}</span>
              <Input
                value={form.addressLine}
                onChange={(e) => patch("addressLine", e.target.value)}
                placeholder={t("addressPlaceholder")}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("city")}</span>
              <Input value={form.city} onChange={(e) => patch("city", e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("region")}</span>
              <Input value={form.region} onChange={(e) => patch("region", e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("country")}</span>
              <Input value={form.country} onChange={(e) => patch("country", e.target.value)} />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">{t("pinHint")}</p>
            <div className="h-72 overflow-hidden rounded-xl border border-border">
              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) => {
                  setForm((f) => ({ ...f, lat, lng }));
                  setSuccess(false);
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("coords")}: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} size="lg">
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
