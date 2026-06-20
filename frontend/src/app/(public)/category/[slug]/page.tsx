import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CategoryResults } from "./category-results";

// Dynamic so the build never calls the API. Metadata is generated at request
// time from the slug (we don't fetch at build).
export const dynamic = "force-dynamic";

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("meta");
  const category = titleCase(slug);
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
  return <CategoryResults slug={slug} />;
}
