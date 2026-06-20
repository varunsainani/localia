import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import prisma from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { logAudit } from "../lib/audit";
import { providerCard } from "../lib/serialize";
import { recomputeRating } from "../lib/rating";
import { t } from "../i18n";

const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, "validation.review.ratingRange")
    .max(5, "validation.review.ratingRange"),
  comment: z.string().min(1, "validation.review.commentRequired").max(2000),
});

// POST /providers/:slug/reviews — one review per client per provider; upserts
// then recomputes the provider's aggregate rating.
export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = reviewSchema.parse(req.body);

  const provider = await prisma.provider.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, userId: true, status: true },
  });
  if (!provider) throw new HttpError(404, "errors.provider.notFound", { code: "NOT_FOUND" });
  if (provider.status !== "APPROVED") {
    throw new HttpError(403, "errors.review.providerNotApproved", { code: "NOT_APPROVED" });
  }
  if (provider.userId === req.userId) {
    throw new HttpError(403, "errors.review.cannotReviewOwn", { code: "OWN_PROFILE" });
  }

  const existing = await prisma.review.findUnique({
    where: { providerId_clientId: { providerId: provider.id, clientId: req.userId! } },
  });
  if (existing) {
    throw new HttpError(409, "errors.review.alreadyReviewed", { code: "ALREADY_REVIEWED" });
  }

  // Create the review and recompute the provider's aggregate rating atomically,
  // so a failure between the two can't leave ratingAvg/reviewCount stale.
  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: { providerId: provider.id, clientId: req.userId!, rating, comment },
      include: { client: { select: { name: true } } },
    });
    await recomputeRating(provider.id, tx);
    return created;
  });
  await logAudit({
    actorId: req.userId,
    action: "review.created",
    targetId: provider.id,
    meta: { rating },
  });

  res.status(201).json({
    review: {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      clientName: review.client?.name ?? t(req.locale, "reviews.anonymous"),
      createdAt: review.createdAt,
    },
  });
});

// GET /me/favorites — the client's favorited providers as cards.
export const listFavorites = asyncHandler(async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    // Only surface favorites whose provider is currently public (APPROVED), so a
    // later-suspended/rejected provider stops leaking through existing favorites.
    where: { clientId: req.userId!, provider: { status: "APPROVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      provider: { include: { categories: { include: { category: true } } } },
    },
  });
  res.json({
    items: favorites.map((f) => providerCard(f.provider, req.locale)),
  });
});

// POST /me/favorites/:providerId — idempotent add.
export const addFavorite = asyncHandler(async (req, res) => {
  // A client may only favorite a public (APPROVED) provider; a PENDING/
  // SUSPENDED/REJECTED provider is treated as not found, matching public gating.
  const provider = await prisma.provider.findFirst({
    where: { id: req.params.providerId, status: "APPROVED" },
    select: { id: true },
  });
  if (!provider) throw new HttpError(404, "errors.provider.notFound", { code: "NOT_FOUND" });

  await prisma.favorite.upsert({
    where: { clientId_providerId: { clientId: req.userId!, providerId: provider.id } },
    update: {},
    create: { clientId: req.userId!, providerId: provider.id },
  });
  res.json({ ok: true });
});

// DELETE /me/favorites/:providerId — idempotent remove.
export const removeFavorite = asyncHandler(async (req, res) => {
  await prisma.favorite.deleteMany({
    where: { clientId: req.userId!, providerId: req.params.providerId },
  });
  res.json({ ok: true });
});
