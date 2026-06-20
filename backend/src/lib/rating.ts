import { Prisma } from "@prisma/client";
import prisma from "./prisma";

// Minimal client surface this needs: works with both the base PrismaClient and
// a transaction client (Prisma.TransactionClient), so the recompute can run
// inside the same $transaction as the review write.
type RatingClient = Pick<Prisma.TransactionClient, "review" | "provider">;

// Recompute and persist a provider's ratingAvg + reviewCount from its reviews.
// Call after any review create/update/delete. Pass the transaction client to
// keep the aggregate update atomic with the write that triggered it.
export async function recomputeRating(
  providerId: string,
  client: RatingClient = prisma,
): Promise<void> {
  const agg = await client.review.aggregate({
    where: { providerId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await client.provider.update({
    where: { id: providerId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      reviewCount: agg._count.rating,
    },
  });
}
