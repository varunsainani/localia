"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { listCategories, type Category } from "@/lib/api";
import { CategoryIcon } from "@/components/category-icon";
import { LoadingBlock, EmptyState } from "@/components/states";

export default function CategoriesPage() {
  const t = useTranslations("categories");
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => {
        setError(true);
        setCategories([]);
      });
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {categories === null ? (
        <LoadingBlock />
      ) : error || categories.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={LayoutGrid} title={error ? t("loadError") : t("empty")} />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <CategoryIcon name={c.icon || c.slug} className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{c.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("providerCount", { count: c.providerCount })}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t("viewCategory")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
