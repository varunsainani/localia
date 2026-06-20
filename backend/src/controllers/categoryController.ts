import { asyncHandler } from "../lib/async-handler";
import prisma from "../lib/prisma";
import { publicCategory } from "../lib/serialize";

// GET /categories — localized names + count of APPROVED providers per category.
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  // One grouped count over the join table, restricted to approved providers.
  const counts = await prisma.providerCategory.groupBy({
    by: ["categoryId"],
    where: { provider: { status: "APPROVED" } },
    _count: { categoryId: true },
  });
  const countByCategory = new Map(counts.map((c) => [c.categoryId, c._count.categoryId]));

  res.json({
    categories: categories.map((c) =>
      publicCategory(c, req.locale, countByCategory.get(c.id) ?? 0),
    ),
  });
});
