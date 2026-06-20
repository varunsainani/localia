import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { SearchClient } from "./search-client";
import { LoadingBlock } from "@/components/states";

// Dynamic: results are fetched client-side at runtime, never at build.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title"), alternates: { canonical: "/search" } };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <SearchClient />
    </Suspense>
  );
}
