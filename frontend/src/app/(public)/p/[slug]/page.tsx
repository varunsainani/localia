import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchProviderServer } from "@/lib/server-api";
import { locationLine } from "@/lib/format";
import { ProfileClient } from "./profile-client";

// Dynamic so the build never calls the API. generateMetadata + JSON-LD run at
// request time and gracefully fall back if the backend is unreachable.
export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL || "https://localia.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("meta");
  const provider = await fetchProviderServer(slug);

  if (!provider) {
    // Unknown/unapproved provider: don't let the soft-404 get indexed.
    return {
      title: "Localia",
      robots: { index: false, follow: false },
    };
  }

  const category = provider.categories[0]?.name ?? "";
  const title = t("providerTitle", {
    name: provider.businessName,
    category,
    city: provider.city,
  });
  const description = provider.headline || provider.about?.slice(0, 160) || title;
  const image = provider.coverUrl || provider.avatarUrl || undefined;
  const imageAlt = t("ogProvider", { name: provider.businessName });

  return {
    title,
    description,
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      title: t("ogProvider", { name: provider.businessName }),
      description,
      type: "profile",
      url: `${APP_URL}/p/${slug}`,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: imageAlt }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogProvider", { name: provider.businessName }),
      description,
      images: image ? [{ url: image, alt: imageAlt }] : undefined,
    },
  };
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = await fetchProviderServer(slug);

  // Unknown/unapproved provider: render the 404 boundary with a real 404 status
  // instead of a soft-404 (HTTP 200) with thin content.
  if (!provider) notFound();

  const t = await getTranslations("profile");

  // JSON-LD: ProfessionalService + BreadcrumbList. Rendered server-side for
  // crawlers; the interactive UI hydrates from the client component.
  const jsonLd = provider
    ? [
        {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: provider.businessName,
          description: provider.about || provider.headline,
          image: provider.coverUrl || provider.avatarUrl || undefined,
          url: `${APP_URL}/p/${slug}`,
          telephone: provider.phone || undefined,
          address: {
            "@type": "PostalAddress",
            streetAddress: provider.addressLine || undefined,
            addressLocality: provider.city || undefined,
            addressRegion: provider.region || undefined,
            addressCountry: provider.country || undefined,
          },
          geo:
            provider.lat || provider.lng
              ? { "@type": "GeoCoordinates", latitude: provider.lat, longitude: provider.lng }
              : undefined,
          aggregateRating:
            provider.reviewCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: provider.ratingAvg,
                  reviewCount: provider.reviewCount,
                }
              : undefined,
          areaServed: locationLine([provider.city, provider.region, provider.country]) || undefined,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Localia", item: APP_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: provider.categories[0]?.name ?? t("breadcrumbCategories"),
              item: provider.categories[0]
                ? `${APP_URL}/category/${provider.categories[0].slug}`
                : `${APP_URL}/categories`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: provider.businessName,
              item: `${APP_URL}/p/${slug}`,
            },
          ],
        },
      ]
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProfileClient slug={slug} />
    </>
  );
}
