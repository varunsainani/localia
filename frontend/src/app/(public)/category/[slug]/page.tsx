import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchCategoriesServer } from "@/lib/server-api";
import { CategoryResults } from "./category-results";

// Dynamic so the build never calls the API. Metadata is generated at request
// time from the localized category list (forwarding X-Locale).
export const dynamic = "force-dynamic";

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// Resolve the localized category name for a slug. Falls back to a titleCased
// slug only when the backend is unreachable (categories === null).
async function resolveCategoryName(slug: string): Promise<string | null> {
  const categories = await fetchCategoriesServer();
  if (categories === null) return titleCase(slug); // backend down — degrade gracefully
  return categories.find((c) => c.slug === slug)?.name ?? null; // null => not found
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("meta");
  const category = (await resolveCategoryName(slug)) ?? titleCase(slug);
  return {
    title: t("categoryTitle", { category }),
    description: t("categoryDescription", { category }),
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title: t("categoryTitle", { category }),
      description: t("categoryDescription", { category }),
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = await resolveCategoryName(slug);
  if (name === null) notFound();
  return <CategoryResults slug={slug} name={name} />;
}
