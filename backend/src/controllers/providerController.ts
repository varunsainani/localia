import { Prisma } from "@prisma/client";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import prisma from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { providerCard, providerDetail, categoryName } from "../lib/serialize";
import { haversineSql } from "../lib/geo";

// --- Query parsing ---------------------------------------------------------

const SORTS = ["relevance", "rating", "distance", "newest"] as const;
type Sort = (typeof SORTS)[number];

function num(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function clampInt(v: unknown, def: number, min: number, max: number): number {
  const n = num(v);
  if (n == null) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

// GET /providers — faceted, ranked, geo-aware search over APPROVED providers.
export const searchProviders = asyncHandler(async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const categorySlug = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
  const region = typeof req.query.region === "string" ? req.query.region.trim() : "";
  const minRating = num(req.query.minRating);
  const availability =
    typeof req.query.availability === "string" ? req.query.availability.trim() : "";
  const lat = num(req.query.lat);
  const lng = num(req.query.lng);
  const radiusKm = num(req.query.radiusKm);
  const page = clampInt(req.query.page, 1, 1, 100000);
  const pageSize = clampInt(req.query.pageSize, 12, 1, 48);
  const offset = (page - 1) * pageSize;

  let sort: Sort = SORTS.includes(req.query.sort as Sort) ? (req.query.sort as Sort) : "relevance";
  const hasCoords = lat != null && lng != null;
  if (sort === "distance" && !hasCoords) {
    throw new HttpError(400, "errors.provider.distanceNeedsCoords", { code: "DISTANCE_NEEDS_COORDS" });
  }

  // Resolve category slug -> id once (so the join condition is indexable).
  let categoryId: string | null = null;
  if (categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!cat) {
      // Unknown category -> empty result set (not an error; UI may pass stale slug).
      return res.json({
        items: [],
        total: 0,
        page,
        pageSize,
        facets: { categories: [], cities: [] },
      });
    }
    categoryId = cat.id;
  }

  // --- WHERE fragment shared by the count, page, and facet queries ---------
  const conds: Prisma.Sql[] = [Prisma.sql`"Provider"."status" = 'APPROVED'`];
  if (q) {
    conds.push(
      Prisma.sql`"Provider"."searchVector" @@ websearch_to_tsquery('simple', immutable_unaccent(${q}))`,
    );
  }
  if (city) conds.push(Prisma.sql`"Provider"."city" ILIKE ${city}`);
  if (region) conds.push(Prisma.sql`"Provider"."region" ILIKE ${region}`);
  if (minRating != null) conds.push(Prisma.sql`"Provider"."ratingAvg" >= ${minRating}`);
  if (availability) conds.push(Prisma.sql`"Provider"."availability" = ${availability}::"Availability"`);
  if (categoryId) {
    conds.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ProviderCategory" pc
      WHERE pc."providerId" = "Provider"."id" AND pc."categoryId" = ${categoryId}
    )`);
  }
  if (hasCoords && radiusKm != null) {
    conds.push(Prisma.sql`${haversineSql(lat!, lng!)} <= ${radiusKm}`);
  }
  const where = Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}`;

  // --- ORDER BY ------------------------------------------------------------
  const rankExpr = q
    ? Prisma.sql`ts_rank("Provider"."searchVector", websearch_to_tsquery('simple', immutable_unaccent(${q})))`
    : Prisma.sql`0`;
  const distExpr = hasCoords ? haversineSql(lat!, lng!) : Prisma.sql`NULL`;

  let orderBy: Prisma.Sql;
  switch (sort) {
    case "rating":
      orderBy = Prisma.sql`"Provider"."featured" DESC, "Provider"."ratingAvg" DESC, "Provider"."reviewCount" DESC`;
      break;
    case "distance":
      orderBy = Prisma.sql`distance_km ASC NULLS LAST, "Provider"."featured" DESC`;
      break;
    case "newest":
      orderBy = Prisma.sql`"Provider"."createdAt" DESC`;
      break;
    case "relevance":
    default:
      orderBy = q
        ? Prisma.sql`rank DESC, "Provider"."featured" DESC, "Provider"."ratingAvg" DESC`
        : Prisma.sql`"Provider"."featured" DESC, "Provider"."ratingAvg" DESC, "Provider"."reviewCount" DESC`;
      break;
  }

  // --- Total count ---------------------------------------------------------
  const countRows = await prisma.$queryRaw<{ count: bigint }[]>(
    Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "Provider" ${where}`,
  );
  const total = Number(countRows[0]?.count ?? 0);

  // --- Page of provider ids (with computed rank/distance) ------------------
  const rows = await prisma.$queryRaw<{ id: string; distance_km: number | null }[]>(
    Prisma.sql`
      SELECT "Provider"."id" AS id,
             ${rankExpr} AS rank,
             ${distExpr} AS distance_km
      FROM "Provider"
      ${where}
      ORDER BY ${orderBy}
      LIMIT ${pageSize} OFFSET ${offset}
    `,
  );

  // Hydrate full rows (with categories) preserving SQL order.
  const ids = rows.map((r) => r.id);
  const distById = new Map(rows.map((r) => [r.id, r.distance_km]));
  const providers = ids.length
    ? await prisma.provider.findMany({
        where: { id: { in: ids } },
        include: { categories: { include: { category: true } } },
      })
    : [];
  const byId = new Map(providers.map((p) => [p.id, p]));
  const items = ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => providerCard(p, req.locale, hasCoords ? distById.get(p.id) : null));

  // --- Facets over the current filtered set --------------------------------
  const facets = await buildFacets(where, req.locale);

  res.json({ items, total, page, pageSize, facets });
});

// Counts per category and per city across the filtered result set.
async function buildFacets(where: Prisma.Sql, locale: string) {
  const [catRows, cityRows] = await Promise.all([
    prisma.$queryRaw<{ categoryId: string; count: bigint }[]>(Prisma.sql`
      SELECT pc."categoryId" AS "categoryId", COUNT(*)::bigint AS count
      FROM "Provider"
      JOIN "ProviderCategory" pc ON pc."providerId" = "Provider"."id"
      ${where}
      GROUP BY pc."categoryId"
      ORDER BY count DESC
    `),
    prisma.$queryRaw<{ city: string; count: bigint }[]>(Prisma.sql`
      SELECT "Provider"."city" AS city, COUNT(*)::bigint AS count
      FROM "Provider"
      ${where}
      GROUP BY "Provider"."city"
      ORDER BY count DESC, city ASC
    `),
  ]);

  const catIds = catRows.map((r) => r.categoryId);
  const cats = catIds.length
    ? await prisma.category.findMany({ where: { id: { in: catIds } } })
    : [];
  const catById = new Map(cats.map((c) => [c.id, c]));

  return {
    categories: catRows
      .map((r) => {
        const c = catById.get(r.categoryId);
        return c
          ? { slug: c.slug, name: categoryName(c, locale), count: Number(r.count) }
          : null;
      })
      .filter((x): x is { slug: string; name: string; count: number } => x != null),
    cities: cityRows.map((r) => ({ city: r.city, count: Number(r.count) })),
  };
}

// GET /providers/:slug — public detail; increments views.
export const getProvider = asyncHandler(async (req, res) => {
  const provider = await prisma.provider.findFirst({
    where: { slug: req.params.slug, status: "APPROVED" },
    include: {
      categories: { include: { category: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { client: { select: { name: true } } },
      },
    },
  });
  if (!provider) throw new HttpError(404, "errors.provider.notFound", { code: "NOT_FOUND" });

  // Best-effort view increment; never block the response.
  prisma.provider
    .update({ where: { id: provider.id }, data: { views: { increment: 1 } } })
    .catch(() => undefined);

  res.json({ provider: providerDetail(provider, req.locale) });
});

const reviewsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

// GET /providers/:slug/reviews — paginated reviews for a provider.
export const getProviderReviews = asyncHandler(async (req, res) => {
  const { page } = reviewsQuery.parse(req.query);
  const pageSize = 10;

  const provider = await prisma.provider.findFirst({
    where: { slug: req.params.slug, status: "APPROVED" },
    select: { id: true },
  });
  if (!provider) throw new HttpError(404, "errors.provider.notFound", { code: "NOT_FOUND" });

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { providerId: provider.id } }),
    prisma.review.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { client: { select: { name: true } } },
    }),
  ]);

  res.json({
    items: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      clientName: r.client?.name ?? "Anonymous",
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
  });
});
