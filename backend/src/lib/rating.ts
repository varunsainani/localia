import prisma from "./prisma";

// Recompute and persist a provider's ratingAvg + reviewCount from its reviews.
// Call after any review create/update/delete.
export async function recomputeRating(providerId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { providerId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.provider.update({
    where: { id: providerId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      reviewCount: agg._count.rating,
    },
  });
}
