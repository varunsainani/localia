"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Pencil, Trash2, Tags, X, AlertCircle } from "lucide-react";
import {
  listAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  ApiError,
  type AdminCategory,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/category-icon";
import { LoadingBlock, EmptyState } from "@/components/states";

interface FormState {
  id: string | null;
  slug: string;
  icon: string;
  nameEn: string;
  nameEs: string;
  namePt: string;
}

const emptyForm: FormState = { id: null, slug: "", icon: "", nameEn: "", nameEs: "", namePt: "" };

function localizedName(c: AdminCategory, locale: string) {
  return locale === "es" ? c.nameEs : locale === "pt" ? c.namePt : c.nameEn;
}

export default function AdminCategories() {
  const t = useTranslations("admin.categories");
  const ta = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reload() {
    setCategories(null);
    setLoadError(false);
    listAdminCategories()
      .then(setCategories)
      .catch(() => setLoadError(true));
  }

  useEffect(reload, []);

  function openCreate() {
    setForm(emptyForm);
    setError("");
  }

  function openEdit(c: AdminCategory) {
    setForm({
      id: c.id,
      slug: c.slug,
      icon: c.icon,
      nameEn: c.nameEn,
      nameEs: c.nameEs,
      namePt: c.namePt,
    });
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.slug.trim() || !form.icon.trim() || !form.nameEn.trim() || !form.nameEs.trim() || !form.namePt.trim()) {
      setError(t("fieldsRequired"));
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      slug: form.slug.trim(),
      icon: form.icon.trim(),
      nameEn: form.nameEn.trim(),
      nameEs: form.nameEs.trim(),
      namePt: form.namePt.trim(),
    };
    try {
      if (form.id) {
        await updateCategory(form.id, payload);
      } else {
        await createCategory(payload);
      }
      setForm(null);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: AdminCategory) {
    if (!window.confirm(t("deleteConfirm", { name: localizedName(c, locale) }))) return;
    try {
      await deleteCategory(c.id);
      reload();
    } catch {
      setError(t("deleteError"));
    }
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <EmptyState
          icon={AlertCircle}
          title={ta("loadError")}
          action={
            <Button variant="outline" onClick={reload}>
              {tc("retry")}
            </Button>
          }
        />
      </div>
    );
  }

  if (categories === null) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("newCategory")}
          </Button>
        }
      />

      {error && !form && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={t("empty")}
          action={<Button onClick={openCreate}>{t("newCategory")}</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CategoryIcon name={c.icon || c.slug} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{localizedName(c, locale)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.slug} · {t("providerCount", { count: c.providerCount })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label={t("edit")}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(c)}
                    aria-label={tc("delete")}
                    className="text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setForm(null)} />
          <form
            onSubmit={save}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{form.id ? t("edit") : t("create")}</h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                aria-label={tc("close")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">{t("slug")}</span>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder={t("slugPlaceholder")}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">{t("icon")}</span>
                  <Input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder={t("iconPlaceholder")}
                  />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t("nameEn")}</span>
                <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t("nameEs")}</span>
                <Input value={form.nameEs} onChange={(e) => setForm({ ...form, nameEs: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t("namePt")}</span>
                <Input value={form.namePt} onChange={(e) => setForm({ ...form, namePt: e.target.value })} />
              </label>
            </div>

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? tc("saving") : form.id ? t("edit") : t("create")}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
