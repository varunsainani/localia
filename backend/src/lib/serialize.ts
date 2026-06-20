import type { Category, Provider, Review, User, AuditLog, ProviderCategory } from "@prisma/client";

// --- Locale helpers --------------------------------------------------------

// Pick the localized category name for the request locale, defaulting to EN.
export function categoryName(category: Category, locale: string): string {
  switch (locale) {
    case "es":
      return category.nameEs;
    case "pt":
      return category.namePt;
    default:
      return category.nameEn;
  }
}

// --- Users -----------------------------------------------------------------

export function publicUser(u: User) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, locale: u.locale };
}

// --- Categories ------------------------------------------------------------

export function publicCategory(
  category: Category,
  locale: string,
  providerCount?: number,
) {
  return {
    id: category.id,
    slug: category.slug,
    name: categoryName(category, locale),
    icon: category.icon,
    providerCount: providerCount ?? 0,
  };
}

// --- Providers -------------------------------------------------------------

type ProviderWithCategories = Provider & {
  categories: (ProviderCategory & { category: Category })[];
};

function providerCategoryList(provider: ProviderWithCategories, locale: string) {
  return provider.categories
    .map((pc) => ({ slug: pc.category.slug, name: categoryName(pc.category, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

// Lightweight provider summary used in listings, search, favorites, admin.
export function providerCard(
  provider: ProviderWithCategories,
  locale: string,
  distanceKm?: number | null,
) {
  return {
    id: provider.id,
    slug: provider.slug,
    businessName: provider.businessName,
    headline: provider.headline,
    avatarUrl: provider.avatarUrl,
    coverUrl: provider.coverUrl,
    city: provider.city,
    region: provider.region,
    country: provider.country,
    lat: provider.lat,
    lng: provider.lng,
    availability: provider.availability,
    ratingAvg: round1(provider.ratingAvg),
    reviewCount: provider.reviewCount,
    featured: provider.featured,
    status: provider.status,
    categories: providerCategoryList(provider, locale),
    ...(distanceKm != null ? { distanceKm: round1(distanceKm) } : {}),
  };
}

type ReviewWithClient = Review & { client: Pick<User, "name"> };

// Full public provider detail (profile page).
export function providerDetail(
  provider: ProviderWithCategories & { reviews?: ReviewWithClient[] },
  locale: string,
) {
  return {
    ...providerCard(provider, locale),
    about: provider.about,
    services: provider.services,
    photos: provider.photos,
    phone: provider.phone,
    whatsapp: provider.whatsapp,
    addressLine: provider.addressLine,
    createdAt: provider.createdAt,
    reviews: (provider.reviews ?? []).map(publicReview),
  };
}

// Owner-facing provider view (private fields like rejectionReason, views).
export function ownerProvider(provider: ProviderWithCategories, locale: string) {
  return {
    ...providerCard(provider, locale),
    about: provider.about,
    services: provider.services,
    photos: provider.photos,
    phone: provider.phone,
    whatsapp: provider.whatsapp,
    addressLine: provider.addressLine,
    rejectionReason: provider.rejectionReason,
    views: provider.views,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

// --- Reviews ---------------------------------------------------------------

export function publicReview(review: ReviewWithClient) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    clientName: review.client?.name ?? "Anonymous",
    createdAt: review.createdAt,
  };
}

// --- Audit -----------------------------------------------------------------

type AuditWithActor = AuditLog & { actor?: Pick<User, "name" | "email"> | null };

export function publicAudit(entry: AuditWithActor) {
  return {
    id: entry.id,
    action: entry.action,
    targetId: entry.targetId,
    actorName: entry.actor?.name ?? null,
    actorEmail: entry.actor?.email ?? null,
    meta: entry.meta,
    createdAt: entry.createdAt,
  };
}

// --- Utils -----------------------------------------------------------------

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
